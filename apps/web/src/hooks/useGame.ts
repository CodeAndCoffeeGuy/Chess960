'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { trackGameStart, trackGameEnd, trackQueueLeave } from '@/lib/posthog';
import type {
  GameEndMessage,
  QueueJoinedMessage,
  GameStateMessage,
  Color,
  TimeControl,
  PlayerInfo
} from '@chess960/proto';

interface GameState {
  id: string;
  color: Color;
  opponent: PlayerInfo;
  moves: string[];
  timeLeft: {
    w: number;
    b: number;
  };
  increment: number;
  toMove: Color;
  drawOffer?: Color;
  takebackOffer?: Color; // Who offered the takeback
  result?: string;
  ended: boolean;
  opening?: {
    name: string;
    eco: string;
  };
  lastUpdate?: number; // Timestamp when clock was last updated
  rematchOffer?: Color; // Who offered the rematch
  chatMessages?: Array<{
    from: Color;
    message: string;
    timestamp: number;
  }>;
  initialFen?: string; // Chess960 starting position FEN
  chess960Position?: number; // Position number (1-960)
}

interface QueueState {
  timeControl: TimeControl;
  rated: boolean;
  estimatedWait: number;
  joinedAt: number;
}

export function useGame() {
  const { on, isConnected } = useWebSocket();
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);

  console.log('About to try direct handler setup - v5');
  
  // Store cleanup functions
  const cleanupRef = useRef<(() => void)[]>([]);

  // Normalize server color values to 'white' | 'black'
  const normalizeColor = (c: any): Color => (c === 'b' || c === 'black') ? 'black' : 'white';
  
  // Set up handlers in useEffect to avoid multiple calls during render
  useEffect(() => {
    if (!on) {
      return;
    }

    if (cleanupRef.current.length > 0) {
      return;
    }

    
    // Handle queue joined
    const unsubscribeQueueJoined = on('queue.joined', (message) => {
      const queueMsg = message as QueueJoinedMessage;
      setIsInQueue(true);
      setQueueState({
        timeControl: queueMsg.tc,
        rated: queueMsg.rated,
        estimatedWait: queueMsg.estimatedWait,
        joinedAt: Date.now(),
      });
      console.log('Game state: Updated isInQueue to true');
    });
    cleanupRef.current.push(unsubscribeQueueJoined);
    
    // Handle queue left
    const unsubscribeQueueLeft = on('queue.left', () => {
      // Track queue leave
      if (queueState) {
        const waitTime = Date.now() - queueState.joinedAt;
        trackQueueLeave(queueState.timeControl, waitTime);
      }

      setIsInQueue(false);
      setQueueState(null);
    });
    cleanupRef.current.push(unsubscribeQueueLeft);

    // Handle match found
    const unsubscribeMatchFound = on('match.found', (message) => {
      const matchMsg = message as any; // Use any for now since server structure doesn't match proto
      console.log('MATCH.FOUND MESSAGE RECEIVED');
      console.log('Raw message:', JSON.stringify(matchMsg, null, 2));
      console.log('matchMsg.color (RAW):', matchMsg.color, 'type:', typeof matchMsg.color);
      console.log('matchMsg.toMove (RAW):', matchMsg.toMove, 'type:', typeof matchMsg.toMove);

      setIsInQueue(false);
      setQueueState(null);

      // Safely access the initial time values with fallbacks
      const initialTime = matchMsg.initial || {};
      const whiteTime = initialTime.w || 60000; // Default to 60 seconds
      const blackTime = initialTime.b || 60000;
      const increment = matchMsg.increment || (initialTime.inc ? initialTime.inc / 1000 : 0); // Convert from ms to seconds

      // Safely access opponent with fallbacks
      const opponent = matchMsg.opponent || {
        handle: 'Anonymous',
        rating: 1500,
        rd: 150,
      };

      const playerColor = normalizeColor(matchMsg.color);
      console.log('BEFORE normalizeColor:', matchMsg.color);
      console.log('AFTER normalizeColor:', playerColor);
      console.log('normalizeColor logic check:');
      console.log('  - Is matchMsg.color === "b"?', matchMsg.color === 'b');
      console.log('  - Is matchMsg.color === "black"?', matchMsg.color === 'black');
      console.log('  - Result:', (matchMsg.color === 'b' || matchMsg.color === 'black') ? 'black' : 'white');

      const newGame = {
        id: matchMsg.gameId,
        color: playerColor,
        opponent,
        moves: Array.isArray(matchMsg.moves) ? matchMsg.moves : [],
        timeLeft: matchMsg.timeLeft || {
          w: whiteTime,
          b: blackTime,
        },
        increment,
        toMove: normalizeColor(matchMsg.toMove || 'white'), // Use normalized toMove
        ended: matchMsg.ended || false,
        lastUpdate: Date.now(), // Set reference timestamp
        initialFen: matchMsg.initialFen, // Chess960 starting position FEN
        chess960Position: matchMsg.chess960Position, // Position number (1-960)
      };

      console.log('Setting currentGame to:', JSON.stringify(newGame, null, 2));

      // Track game start
      trackGameStart(
        queueState?.timeControl || matchMsg.tc || '1+0',
        queueState?.rated ?? true,
        matchMsg.gameId
      );

      setCurrentGame(newGame);
    });
    cleanupRef.current.push(unsubscribeMatchFound);

    // Handle game state updates
    const unsubscribeGameState = on('game.state', (message) => {
      const stateMsg = message as GameStateMessage;
      console.log('Game state: Game state update received', stateMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== stateMsg.gameId) return prev;

        return {
          ...prev,
          moves: Array.isArray(stateMsg.moves) ? stateMsg.moves : [],
          timeLeft: stateMsg.timeLeft,
          toMove: normalizeColor(stateMsg.toMove),
          drawOffer: stateMsg.drawOffer ? normalizeColor(stateMsg.drawOffer) : undefined,
          takebackOffer: stateMsg.takebackOffer ? normalizeColor(stateMsg.takebackOffer) : undefined,
        };
      });
    });
    cleanupRef.current.push(unsubscribeGameState);

    // Handle move made
    const unsubscribeMoveMade = on('move.made', (message) => {
      const moveMsg = message as any; // Use any to access opening field
      console.log('MOVE.MADE RECEIVED');
      console.log('Move message:', JSON.stringify(moveMsg, null, 2));
      setCurrentGame(prev => {
        if (!prev || prev.id !== moveMsg.gameId) {
          console.log('Move ignored - wrong game ID or no game');
          return prev;
        }

        // Calculate next player based on whose turn it was
        const by = normalizeColor(moveMsg.by);
        const nextToMove = by === 'white' ? 'black' : 'white';

        // Ensure prev.moves is an array before spreading
        const prevMoves = Array.isArray(prev.moves) ? prev.moves : [];
        const newMoves = [...prevMoves, moveMsg.uci];
        console.log('Adding move to array:', moveMsg.uci);
        console.log('New moves array:', newMoves);
        console.log('Move count:', newMoves.length);

        // Update opening if provided in message
        if (moveMsg.opening) {
          console.log('Opening update:', moveMsg.opening);
        }

        return {
          ...prev,
          moves: newMoves,
          timeLeft: moveMsg.timeLeft,
          toMove: nextToMove,
          opening: moveMsg.opening || prev.opening,
          lastUpdate: Date.now(), // Update reference timestamp on move
        };
      });
    });
    cleanupRef.current.push(unsubscribeMoveMade);

    // Handle game.move messages from server (when moves are made)
    const unsubscribeGameMove = on('game.move', (message) => {
      console.log('Game state: game.move received', message);
      setCurrentGame(prev => {
        if (!prev || prev.id !== (message as any).gameId) return prev;

        const msg: any = message as any;
        const normalizedToMove = msg.toMove ? normalizeColor(msg.toMove) : prev.toMove;

        return {
          ...prev,
          moves: Array.isArray(msg.moves) ? msg.moves : (prev.moves || []),
          timeLeft: msg.timeLeft || prev.timeLeft,
          toMove: normalizedToMove,
          increment: msg.increment !== undefined ? msg.increment : prev.increment,
        };
      });
    });
    cleanupRef.current.push(unsubscribeGameMove);

    // Handle game end
    const unsubscribeGameEnd = on('game.end', (message) => {
      const endMsg = message as GameEndMessage;
      console.log('Game state: Game end received', endMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== endMsg.gameId) return prev;

        const finalGame = {
          ...prev,
          result: endMsg.result,
          ended: true,
        };

        // Track game end
        const gameStartTime = queueState?.joinedAt || Date.now() - 60000; // Estimate if not available
        const gameDuration = Date.now() - gameStartTime;
        trackGameEnd(endMsg.gameId, endMsg.result, gameDuration);

        // Add to history
        setGameHistory(history => {
          const prevHistory = Array.isArray(history) ? history : [];
          return [...prevHistory, finalGame];
        });

        return finalGame;
      });
    });
    cleanupRef.current.push(unsubscribeGameEnd);

    // Handle rematch offered
    const unsubscribeRematchOffered = on('rematch.offered', (message) => {
      const rematchMsg = message as any;
      console.log('Game state: Rematch offered received', rematchMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== rematchMsg.gameId) return prev;
        return {
          ...prev,
          rematchOffer: normalizeColor(rematchMsg.by),
        };
      });
    });
    cleanupRef.current.push(unsubscribeRematchOffered);

    // Handle rematch accepted (starts new game)
    const unsubscribeRematchAccepted = on('rematch.accepted', (message) => {
      const rematchMsg = message as any;
      console.log('Game state: Rematch accepted received', rematchMsg);

      // Create new game from rematch
      const newGame = {
        id: rematchMsg.newGameId,
        color: normalizeColor(rematchMsg.color),
        opponent: rematchMsg.opponent,
        moves: [],
        timeLeft: rematchMsg.initial,
        increment: rematchMsg.initial.inc / 1000,
        toMove: 'white' as Color,
        ended: false,
        lastUpdate: Date.now(),
        initialFen: rematchMsg.initialFen, // Chess960 starting position FEN
        chess960Position: rematchMsg.chess960Position, // Position number (1-960)
      };

      setCurrentGame(newGame);
    });
    cleanupRef.current.push(unsubscribeRematchAccepted);

    // Handle rematch declined
    const unsubscribeRematchDeclined = on('rematch.declined', (message) => {
      const rematchMsg = message as any;
      console.log('Game state: Rematch declined received', rematchMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== rematchMsg.gameId) return prev;
        return {
          ...prev,
          rematchOffer: undefined,
        };
      });
    });
    cleanupRef.current.push(unsubscribeRematchDeclined);

    // Handle chat received
    const unsubscribeChatReceived = on('chat.received', (message) => {
      const chatMsg = message as any;
      console.log('Game state: Chat message received', chatMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== chatMsg.gameId) return prev;

        const newMessage = {
          from: normalizeColor(chatMsg.from),
          message: chatMsg.message,
          timestamp: chatMsg.timestamp || Date.now(),
        };

        return {
          ...prev,
          chatMessages: [...(prev.chatMessages || []), newMessage],
        };
      });
    });
    cleanupRef.current.push(unsubscribeChatReceived);

    // Handle takeback offered
    const unsubscribeTakebackOffered = on('takeback.offered', (message) => {
      const takebackMsg = message as any;
      console.log('Game state: Takeback offered received', takebackMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== takebackMsg.gameId) return prev;
        return {
          ...prev,
          takebackOffer: normalizeColor(takebackMsg.by),
        };
      });
    });
    cleanupRef.current.push(unsubscribeTakebackOffered);

    // Handle takeback accepted
    const unsubscribeTakebackAccepted = on('takeback.accepted', (message) => {
      const takebackMsg = message as any;
      console.log('Game state: Takeback accepted received', takebackMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== takebackMsg.gameId) return prev;

        // Remove the last move when takeback is accepted
        const newMoves = prev.moves.slice(0, -1);

        return {
          ...prev,
          moves: newMoves,
          takebackOffer: undefined,
          // The server should send updated time/toMove, but we can infer toMove
          toMove: prev.toMove === 'white' ? 'black' : 'white',
        };
      });
    });
    cleanupRef.current.push(unsubscribeTakebackAccepted);

    // Handle takeback declined
    const unsubscribeTakebackDeclined = on('takeback.declined', (message) => {
      const takebackMsg = message as any;
      console.log('Game state: Takeback declined received', takebackMsg);
      setCurrentGame(prev => {
        if (!prev || prev.id !== takebackMsg.gameId) return prev;
        return {
          ...prev,
          takebackOffer: undefined,
        };
      });
    });
    cleanupRef.current.push(unsubscribeTakebackDeclined);

    console.log('Handler setup complete in useEffect!');
  }, [on]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up direct handlers on unmount');
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, []);
  
  // Time management - reference-based timing for accuracy
  // We use a tick to trigger re-renders, but time is calculated on-demand
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!currentGame || currentGame.ended) return;

    console.log('Clock running for', currentGame.toMove);

    // Update every 100ms to trigger re-renders for smooth countdown
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [currentGame?.id, currentGame?.ended, currentGame?.toMove]);
  
  // Game helper functions
  const isMyTurn = currentGame ? currentGame.toMove === currentGame.color : false;
  
  // Calculate elapsed time since last update
  const getElapsedTime = () => {
    if (!currentGame || !currentGame.lastUpdate || currentGame.ended) return 0;
    return Date.now() - currentGame.lastUpdate;
  };

  const getMyTime = () => {
    if (!currentGame) return 0;
    const myColor = currentGame.color;
    const storedTime = myColor === 'white' ? currentGame.timeLeft.w : currentGame.timeLeft.b;

    // Clock only runs after each player has made their first move
    // White's clock starts after white moves (moves.length >= 1)
    // Black's clock starts after black moves (moves.length >= 2)
    const shouldRunClock =
      (currentGame.toMove === 'white' && currentGame.moves.length >= 1) ||
      (currentGame.toMove === 'black' && currentGame.moves.length >= 2);

    if (currentGame.toMove === myColor && !currentGame.ended && shouldRunClock) {
      const elapsed = getElapsedTime();
      return Math.max(0, storedTime - elapsed);
    }

    return storedTime;
  };

  const getOpponentTime = () => {
    if (!currentGame) return 0;
    const opponentColor = currentGame.color === 'white' ? 'black' : 'white';
    const storedTime = opponentColor === 'white' ? currentGame.timeLeft.w : currentGame.timeLeft.b;

    // Clock only runs after each player has made their first move
    // White's clock starts after white moves (moves.length >= 1)
    // Black's clock starts after black moves (moves.length >= 2)
    const shouldRunClock =
      (currentGame.toMove === 'white' && currentGame.moves.length >= 1) ||
      (currentGame.toMove === 'black' && currentGame.moves.length >= 2);

    if (currentGame.toMove === opponentColor && !currentGame.ended && shouldRunClock) {
      const elapsed = getElapsedTime();
      return Math.max(0, storedTime - elapsed);
    }

    return storedTime;
  };
  
  const canOfferDraw = () => {
    if (!currentGame || currentGame.ended) return false;
    if (currentGame.drawOffer === currentGame.color) return false; // Already offered
    return (currentGame.moves?.length || 0) >= 2; // Must have at least 1 move each
  };

  const canAcceptDraw = () => {
    if (!currentGame || currentGame.ended) return false;
    const opponentColor = currentGame.color === 'white' ? 'black' : 'white';
    return currentGame.drawOffer === opponentColor;
  };

  const canAbort = () => {
    if (!currentGame || currentGame.ended) return false;
    return (currentGame.moves?.length || 0) <= 2; // Can abort in first few moves
  };
  
  return {
    gameState: {
      currentGame,
      isInQueue,
      queueState,
      gameHistory,
      isMyTurn,
      getMyTime,
      getOpponentTime,
      canOfferDraw,
      canAcceptDraw,
      canAbort,
      isConnected,
    },
    // Deprecated - use gameState instead
    currentGame,
    isInQueue,
    queueState,
    gameHistory,
    isConnected,
  };
}
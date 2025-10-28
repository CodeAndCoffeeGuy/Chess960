import { v4 as uuidv4 } from 'uuid';
import { ChessEngine } from './chess-engine';
import type { GameState, ClientConnection } from '../types';
import type { 
  GameEndMessage, 
  MoveMadeMessage, 
  GameStateMessage,
  Color,
  TimeControl,
  GameResult
} from '@chess960/proto';

export class GameManager {
  private games = new Map<string, GameState>();
  private userGames = new Map<string, string>(); // userId -> gameId

  createGame(
    whiteId: string,
    blackId: string,
    whiteConnection: ClientConnection,
    blackConnection: ClientConnection,
    tc: TimeControl
  ): GameState {
    const gameId = uuidv4();
    
    // Parse time control
    const [baseTime, increment] = tc.split('+').map(Number);
    const baseTimeMs = baseTime * 60 * 1000; // minutes to milliseconds
    const incrementMs = increment * 1000; // seconds to milliseconds

    const now = Date.now();
    const game: GameState = {
      id: gameId,
      whiteId,
      blackId,
      whiteConnection,
      blackConnection,
      moves: [],
      timeLeft: {
        white: baseTimeMs,
        black: baseTimeMs,
      },
      increment: {
        white: incrementMs,
        black: incrementMs,
      },
      toMove: 'white',
      startedAt: now,
      lastMoveAt: now,
      drawOffer: null,
      takebackOffer: null,
      result: null,
      ended: false,
      clockStartedFor: {
        white: false,
        black: false,
      },
    };

    this.games.set(gameId, game);
    this.userGames.set(whiteId, gameId);
    this.userGames.set(blackId, gameId);

    // Update connection game references
    whiteConnection.currentGameId = gameId;
    blackConnection.currentGameId = gameId;

    // Schedule time forfeit check
    this.scheduleTimeForfeitCheck(game);

    return game;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  getUserGame(userId: string): GameState | undefined {
    const gameId = this.userGames.get(userId);
    return gameId ? this.games.get(gameId) : undefined;
  }

  makeMove(
    gameId: string,
    userId: string,
    uci: string,
    clientTs: number,
    seq: number
  ): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.ended) {
      return { success: false, error: 'Game has ended' };
    }

    // Check if it's the player's turn
    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';
    if (game.toMove !== playerColor) {
      return { success: false, error: 'Not your turn' };
    }

    // Validate move
    const engine = ChessEngine.fromMoves(game.moves);
    if (!engine.isValidMove(uci)) {
      return { success: false, error: 'Invalid move' };
    }

    // Calculate time
    const now = Date.now();
    const currentPlayerTime = game.timeLeft[playerColor as keyof typeof game.timeLeft];
    const bothPlayersHavePlayed = game.moves.length >= 2;

    // Only deduct time if both players have made their first move
    let newTime = currentPlayerTime;
    if (bothPlayersHavePlayed) {
      const timeElapsed = now - game.lastMoveAt;

      // Check if player has flagged
      if (currentPlayerTime - timeElapsed <= 0) {
        this.endGame(game, playerColor === 'white' ? 'flag-white' : 'flag-black', 'time forfeit');
        return { success: false, error: 'Time forfeit' };
      }

      // Update time with increment
      newTime = Math.max(0, currentPlayerTime - timeElapsed + game.increment[playerColor as keyof typeof game.increment]);
      game.timeLeft[playerColor as keyof typeof game.timeLeft] = newTime;
    } else {
      // First move by this player - just add increment
      newTime = currentPlayerTime + game.increment[playerColor as keyof typeof game.increment];
      game.timeLeft[playerColor as keyof typeof game.timeLeft] = newTime;
    }

    // Make the move
    engine.makeMove(uci);
    game.moves.push(uci);

    const opponentColor: 'white' | 'black' = playerColor === 'white' ? 'black' : 'white';
    game.toMove = opponentColor;
    game.lastMoveAt = now;
    game.drawOffer = null;

    // Mark that this player has played
    if (!game.clockStartedFor[playerColor as keyof typeof game.clockStartedFor]) {
      game.clockStartedFor[playerColor as keyof typeof game.clockStartedFor] = true;
    }

    // After second move, both clocks are now active
    if (game.moves.length >= 2) {
      game.clockStartedFor.white = true;
      game.clockStartedFor.black = true;
    }

    // Check for game end
    const gameResult = engine.getResult();
    if (gameResult) {
      this.endGame(game, gameResult.result as GameResult, gameResult.reason);
    }

    // Broadcast move to both players
    this.broadcastMove(game, uci, playerColor, now, seq);

    // Schedule time forfeit check for the next player
    this.scheduleTimeForfeitCheck(game);

    return { success: true };
  }

  offerDraw(gameId: string, userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.ended) {
      return { success: false, error: 'Game has ended' };
    }

    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';
    
    if (game.drawOffer === playerColor) {
      return { success: false, error: 'Draw already offered' };
    }

    game.drawOffer = playerColor;

    // Broadcast draw offer
    const message = {
      t: 'draw.offered' as const,
      gameId,
      by: playerColor,
    };

    game.whiteConnection?.ws.send(JSON.stringify(message));
    game.blackConnection?.ws.send(JSON.stringify(message));

    return { success: true };
  }

  acceptDraw(gameId: string, userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.ended) {
      return { success: false, error: 'Game has ended' };
    }

    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';
    const opponentColor: Color = playerColor === 'white' ? 'black' : 'white';

    if (game.drawOffer !== opponentColor) {
      return { success: false, error: 'No draw offer to accept' };
    }

    this.endGame(game, '1/2-1/2', 'draw by agreement');
    return { success: true };
  }

  declineDraw(gameId: string, userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';
    const opponentColor: Color = playerColor === 'white' ? 'black' : 'white';

    if (game.drawOffer !== opponentColor) {
      return { success: false, error: 'No draw offer to decline' };
    }

    game.drawOffer = null;

    // Broadcast draw declined
    const message = {
      t: 'draw.declined' as const,
      gameId,
      by: playerColor,
    };

    game.whiteConnection?.ws.send(JSON.stringify(message));
    game.blackConnection?.ws.send(JSON.stringify(message));

    return { success: true };
  }

  offerTakeback(gameId: string, userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.ended) {
      return { success: false, error: 'Game has ended' };
    }

    // Cannot takeback if no moves have been made
    if (game.moves.length === 0) {
      return { success: false, error: 'No moves to take back' };
    }

    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';

    if (game.takebackOffer === playerColor) {
      return { success: false, error: 'Takeback already offered' };
    }

    // Check if opponent allows takebacks
    const opponentConnection = playerColor === 'white' ? game.blackConnection : game.whiteConnection;
    if (opponentConnection?.user?.allowTakebacks === false) {
      return { success: false, error: 'Opponent does not allow takeback requests' };
    }

    game.takebackOffer = playerColor;

    // Broadcast takeback offer
    const message = {
      t: 'takeback.offered' as const,
      gameId,
      by: playerColor,
    };

    game.whiteConnection?.ws.send(JSON.stringify(message));
    game.blackConnection?.ws.send(JSON.stringify(message));

    return { success: true };
  }

  acceptTakeback(gameId: string, userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.ended) {
      return { success: false, error: 'Game has ended' };
    }

    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';
    const opponentColor: Color = playerColor === 'white' ? 'black' : 'white';

    if (game.takebackOffer !== opponentColor) {
      return { success: false, error: 'No takeback offer to accept' };
    }

    if (game.moves.length === 0) {
      return { success: false, error: 'No moves to take back' };
    }

    // Remove the last move
    game.moves.pop();

    // Switch turn back
    game.toMove = game.toMove === 'white' ? 'black' : 'white';

    // Clear takeback offer
    game.takebackOffer = null;

    // Broadcast takeback accepted
    const message = {
      t: 'takeback.accepted' as const,
      gameId,
      by: playerColor,
    };

    game.whiteConnection?.ws.send(JSON.stringify(message));
    game.blackConnection?.ws.send(JSON.stringify(message));

    return { success: true };
  }

  declineTakeback(gameId: string, userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';
    const opponentColor: Color = playerColor === 'white' ? 'black' : 'white';

    if (game.takebackOffer !== opponentColor) {
      return { success: false, error: 'No takeback offer to decline' };
    }

    game.takebackOffer = null;

    // Broadcast takeback declined
    const message = {
      t: 'takeback.declined' as const,
      gameId,
      by: playerColor,
    };

    game.whiteConnection?.ws.send(JSON.stringify(message));
    game.blackConnection?.ws.send(JSON.stringify(message));

    return { success: true };
  }

  resign(gameId: string, userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.ended) {
      return { success: false, error: 'Game has ended' };
    }

    const playerColor: Color = userId === game.whiteId ? 'white' : 'black';
    const result = playerColor === 'white' ? 'resign-white' : 'resign-black';
    
    this.endGame(game, result, 'resignation');
    return { success: true };
  }

  abort(gameId: string, _userId: string): { success: boolean; error?: string } {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.ended) {
      return { success: false, error: 'Game has ended' };
    }

    // Only allow abort in first few moves or if no moves made
    if (game.moves.length > 2) {
      return { success: false, error: 'Cannot abort after move 2' };
    }

    this.endGame(game, 'abort', 'game aborted');
    return { success: true };
  }

  reconnectPlayer(gameId: string, userId: string, connection: ClientConnection): GameStateMessage | null {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }

    // Update connection
    if (userId === game.whiteId) {
      game.whiteConnection = connection;
    } else if (userId === game.blackId) {
      game.blackConnection = connection;
    } else {
      return null;
    }

    connection.currentGameId = gameId;

    // Calculate current time
    const now = Date.now();
    const updatedTimeLeft = { ...game.timeLeft };
    const bothPlayersHavePlayed = game.moves.length >= 2;

    if (!game.ended && bothPlayersHavePlayed) {
      const timeElapsed = now - game.lastMoveAt;
      updatedTimeLeft[game.toMove] = Math.max(0, game.timeLeft[game.toMove] - timeElapsed);
    }

    // Return current game state
    return {
      t: 'game.state',
      gameId,
      moves: game.moves,
      timeLeft: { w: updatedTimeLeft.white, b: updatedTimeLeft.black },
      toMove: game.toMove,
      drawOffer: game.drawOffer || undefined,
      takebackOffer: game.takebackOffer || undefined,
      initialFen: game.initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      chess960Position: game.chess960Position || 518, // Standard chess is position 518 in Chess960
    };
  }

  private broadcastMove(game: GameState, uci: string, by: Color, serverTs: number, seq: number) {
    const message: MoveMadeMessage = {
      t: 'move.made',
      gameId: game.id,
      uci,
      by,
      serverTs,
      seq,
      timeLeft: { w: game.timeLeft.white, b: game.timeLeft.black },
    };

    const messageStr = JSON.stringify(message);
    game.whiteConnection?.ws.send(messageStr);
    game.blackConnection?.ws.send(messageStr);
  }

  private endGame(game: GameState, result: GameResult, reason: string) {
    if (game.ended) return;

    game.ended = true;
    game.result = result;

    // Clear time forfeit check timeout
    if (game.timeoutId) {
      clearTimeout(game.timeoutId);
      game.timeoutId = undefined;
    }

    // Clear user game mappings
    this.userGames.delete(game.whiteId);
    this.userGames.delete(game.blackId);

    // Clear connection game references
    if (game.whiteConnection) {
      game.whiteConnection.currentGameId = null;
    }
    if (game.blackConnection) {
      game.blackConnection.currentGameId = null;
    }

    // Broadcast game end
    const message: GameEndMessage = {
      t: 'game.end',
      gameId: game.id,
      result,
      reason,
    };

    const messageStr = JSON.stringify(message);
    game.whiteConnection?.ws.send(messageStr);
    game.blackConnection?.ws.send(messageStr);

    // TODO: Persist game to database and update ratings
    this.persistGame(game);
  }

  private async persistGame(game: GameState) {
    const { getGamePersistenceService } = await import('../services/game-persistence');
    const persistenceService = getGamePersistenceService();
    
    try {
      await persistenceService.persistGame(game);
      
      // Run fairplay analysis asynchronously (don't block game ending)
      this.runFairplayAnalysis(game);
    } catch (error) {
      console.error(`Failed to persist game ${game.id}:`, error);
    }
  }

  private async runFairplayAnalysis(game: GameState) {
    try {
      if (game.moves.length < 10) {
        return; // Skip analysis for very short games
      }

      const { getFairplayDetector } = await import('../services/fairplay-detector');
      const detector = getFairplayDetector();
      
      // Calculate move times (simplified - in reality you'd track actual times)
      const moveTimes = game.moves.map(() => Math.random() * 10000 + 1000); // Placeholder
      
      const reports = await detector.analyzeGame(game.id, game.moves, moveTimes);
      
      for (const report of reports) {
        if (report.suspicionLevel > 60) {
          console.log(`⚠️ High suspicion detected: User ${report.userId} in game ${game.id} (score: ${report.suspicionLevel})`);
          console.log(`Flags: ${report.flags.join(', ')}`);
        }
      }
    } catch (error) {
      console.error(`Fairplay analysis failed for game ${game.id}:`, error);
    }
  }

  // Cleanup disconnected games
  cleanupGame(gameId: string) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Check if both players are disconnected
    const whiteDisconnected = !game.whiteConnection || game.whiteConnection.ws.readyState !== 1;
    const blackDisconnected = !game.blackConnection || game.blackConnection.ws.readyState !== 1;

    if (whiteDisconnected && blackDisconnected) {
      this.games.delete(gameId);
      this.userGames.delete(game.whiteId);
      this.userGames.delete(game.blackId);
    }
  }

  // Get all active games count
  getActiveGamesCount(): number {
    return this.games.size;
  }

  // Schedule a timeout to check for time forfeit
  private scheduleTimeForfeitCheck(game: GameState) {
    // Clear any existing timeout
    if (game.timeoutId) {
      clearTimeout(game.timeoutId);
    }

    // Don't schedule if game has ended
    if (game.ended) {
      return;
    }

    // Don't schedule if both players haven't played yet
    const bothPlayersHavePlayed = game.moves.length >= 2;
    if (!bothPlayersHavePlayed) {
      return;
    }

    // Calculate time until current player runs out
    const now = Date.now();
    const timeElapsed = now - game.lastMoveAt;
    const currentPlayerTime = game.timeLeft[game.toMove];
    const timeRemaining = currentPlayerTime - timeElapsed;

    // If already out of time, end the game immediately
    if (timeRemaining <= 0) {
      this.endGame(game, game.toMove === 'white' ? 'flag-white' : 'flag-black', 'time forfeit');
      return;
    }

    // Set timeout to check when time expires (plus 100ms buffer for timing precision)
    game.timeoutId = setTimeout(() => {
      // Double-check time hasn't expired
      const checkNow = Date.now();
      const checkTimeElapsed = checkNow - game.lastMoveAt;
      const checkTimeRemaining = game.timeLeft[game.toMove] - checkTimeElapsed;

      if (checkTimeRemaining <= 0 && !game.ended) {
        this.endGame(game, game.toMove === 'white' ? 'flag-white' : 'flag-black', 'time forfeit');
      }
    }, timeRemaining + 100);
  }
}
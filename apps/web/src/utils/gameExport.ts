import { Chess } from 'chess.js';

interface GameExportData {
  moves: string[];
  whitePlayer: string;
  blackPlayer: string;
  result?: string;
  timeControl?: string;
  rated?: boolean;
  date?: Date;
  opening?: {
    name: string;
    eco: string;
  };
}

/**
 * Generate PGN (Portable Game Notation) from game data
 */
export function generatePGN(data: GameExportData): string {
  const {
    moves,
    whitePlayer,
    blackPlayer,
    result,
    timeControl,
    rated,
    date = new Date(),
    opening,
  } = data;

  // PGN headers
  const headers: string[] = [
    `[Event "Chess960 ${rated ? 'Rated' : 'Casual'} Game"]`,
    `[Site "chess960.vercel.app"]`,
    `[Date "${formatPGNDate(date)}"]`,
    `[White "${whitePlayer}"]`,
    `[Black "${blackPlayer}"]`,
    `[Result "${formatPGNResult(result)}"]`,
  ];

  if (timeControl) {
    headers.push(`[TimeControl "${timeControl}"]`);
  }

  if (opening) {
    headers.push(`[Opening "${opening.name}"]`);
    headers.push(`[ECO "${opening.eco}"]`);
  }

  // Convert UCI moves to SAN notation
  const chess = new Chess();
  const sanMoves: string[] = [];

  for (const uciMove of moves) {
    try {
      const from = uciMove.slice(0, 2);
      const to = uciMove.slice(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

      const move = chess.move({
        from,
        to,
        promotion,
      });

      if (move) {
        sanMoves.push(move.san);
      }
    } catch (error) {
      console.error('Error converting move to SAN:', uciMove, error);
    }
  }

  // Format moves in PGN style (numbered pairs)
  const movePairs: string[] = [];
  for (let i = 0; i < sanMoves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = sanMoves[i];
    const blackMove = sanMoves[i + 1];

    if (blackMove) {
      movePairs.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    } else {
      movePairs.push(`${moveNumber}. ${whiteMove}`);
    }
  }

  const moveText = movePairs.join(' ');
  const resultText = formatPGNResult(result);

  // Combine headers and moves
  return `${headers.join('\n')}\n\n${moveText} ${resultText}`;
}

/**
 * Get current position as FEN
 */
export function getCurrentFEN(moves: string[]): string {
  const chess = new Chess();

  for (const uciMove of moves) {
    try {
      const from = uciMove.slice(0, 2);
      const to = uciMove.slice(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;

      chess.move({
        from,
        to,
        promotion,
      });
    } catch (error) {
      console.error('Error applying move:', uciMove, error);
    }
  }

  return chess.fen();
}

/**
 * Download PGN as a file
 */
export function downloadPGN(pgn: string, filename: string = 'game.pgn'): void {
  const blob = new Blob([pgn], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch {
    console.error('Failed to copy to clipboard');
    return false;
  }
}

/**
 * Generate shareable game link
 */
export function generateGameLink(gameId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/game/${gameId}`;
  }
  return `https://chess960.vercel.app/game/${gameId}`;
}

// Helper functions
function formatPGNDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatPGNResult(result?: string): string {
  if (!result) return '*';

  if (result.includes('White wins') || result.includes('white')) return '1-0';
  if (result.includes('Black wins') || result.includes('black')) return '0-1';
  if (result.includes('Draw') || result.includes('draw')) return '1/2-1/2';

  return '*';
}

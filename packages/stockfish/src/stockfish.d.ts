// Type declarations for stockfish module
declare module 'stockfish' {
  interface StockfishWorker {
    postMessage(_message: string): void;
    onmessage?: (_event: MessageEvent) => void;
    listen?: (_message: string) => void;
    terminate(): void;
  }

  function Stockfish(): StockfishWorker;
  export default Stockfish;
}

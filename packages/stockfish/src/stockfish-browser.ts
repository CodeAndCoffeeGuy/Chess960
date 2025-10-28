/**
 * Browser-compatible Stockfish engine using WebAssembly
 * This runs entirely in the user's browser - no server required!
 */

import { Chess } from 'chess.js';
import { AnalysisOptions, AnalysisResult, PositionAnalysis, AnalysisMove } from './types';

export class StockfishBrowser {
  private worker: Worker | null = null;
  private engineReady = false;
  private pendingCallbacks: Map<string, (data: string | boolean) => void> = new Map();
  private initPromise: Promise<void>;

  constructor() {
    // Start loading stockfish and store the promise
    this.initPromise = this.loadStockfish();
  }

  private async loadStockfish(): Promise<void> {
    // Use WASM lite single-threaded version for better compatibility
    const workerUrl = '/stockfish/stockfish-17.1-lite-single-03e3232.js';

    console.log('Creating Stockfish worker from:', workerUrl);

    try {
      // Create a Web Worker directly from our hosted file
      this.worker = new Worker(workerUrl);
      console.log('Worker created successfully');

      // Set up the ready promise FIRST, before any messages arrive
      const readyPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingCallbacks.delete('ready');
          console.error('Engine failed to respond to UCI command within 30 seconds');
          reject(new Error('Engine initialization timeout - no response from Stockfish'));
        }, 30000);

        this.pendingCallbacks.set('ready', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      // Set up message handler - handle both string and object messages
      this.worker.onmessage = (event: MessageEvent) => {
        const data = typeof event.data === 'string' ? event.data : event.data?.message || '';
        if (data) {
          this.handleEngineOutput(data);
        }
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('Stockfish worker error:', error);
        console.error('Error details:', {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno
        });
      };

      // Wait a bit for worker to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Initialize engine
      console.log('Sending UCI command...');
      this.sendCommand('uci');

      // Wait for engine to be ready
      await readyPromise;
      console.log('Stockfish fully initialized and ready!');
    } catch (error) {
      console.error('Failed to create worker:', error);
      throw error;
    }
  }

  private handleEngineOutput(output: string): void {
    const trimmedLine = output.trim();
    console.log('Engine output:', trimmedLine);

    if (trimmedLine === 'uciok') {
      console.log('Engine ready!');
      this.engineReady = true;
      // Trigger any waiting callbacks
      const callback = this.pendingCallbacks.get('ready');
      if (callback) {
        callback(true);
        this.pendingCallbacks.delete('ready');
      }
    } else if (trimmedLine.startsWith('info')) {
      // Emit info to any listening callbacks
      const callback = this.pendingCallbacks.get('info');
      if (callback) {
        callback(trimmedLine);
      }
    } else if (trimmedLine.startsWith('bestmove')) {
      console.log('Best move found:', trimmedLine);
      // Emit bestmove to callback
      const callback = this.pendingCallbacks.get('bestmove');
      if (callback) {
        callback(trimmedLine);
        this.pendingCallbacks.delete('bestmove');
      }
    }
  }

  private sendCommand(command: string): void {
    if (!this.worker) {
      throw new Error('Stockfish engine not available');
    }
    // Use standard Worker API
    this.worker.postMessage(command);
  }

  async analyzePosition(fen: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    // Wait for initialization to complete
    await this.initPromise;

    const depth = options.depth || 15;
    const multipv = options.multipv || 3;

    return new Promise((resolve, reject) => {
      let bestMove: string = '';
      let evaluation = 0;
      let analysisDepth = 0;
      let nodes = 0;
      let time = 0;
      const alternatives: AnalysisMove[] = [];

      const timeout = setTimeout(() => {
        this.pendingCallbacks.delete('info');
        this.pendingCallbacks.delete('bestmove');
        reject(new Error('Analysis timeout'));
      }, options.time || 30000); // 30 seconds default

      const handleInfo = (info: string | boolean) => {
        if (typeof info !== 'string') return;
        const parts = info.split(' ');

        if (info.includes('depth')) {
          const depthIndex = parts.indexOf('depth');
          if (depthIndex !== -1 && parts[depthIndex + 1]) {
            analysisDepth = parseInt(parts[depthIndex + 1]);
          }
        }

        if (info.includes('cp')) {
          const cpIndex = parts.indexOf('cp');
          if (cpIndex !== -1 && parts[cpIndex + 1]) {
            evaluation = parseInt(parts[cpIndex + 1]);
          }
        }

        if (info.includes('mate')) {
          const mateIndex = parts.indexOf('mate');
          if (mateIndex !== -1 && parts[mateIndex + 1]) {
            const mateIn = parseInt(parts[mateIndex + 1]);
            // Convert mate score to centipawns (very large number)
            evaluation = mateIn > 0 ? 10000 : -10000;
          }
        }

        if (info.includes('nodes')) {
          const nodesIndex = parts.indexOf('nodes');
          if (nodesIndex !== -1 && parts[nodesIndex + 1]) {
            nodes = parseInt(parts[nodesIndex + 1]);
          }
        }

        if (info.includes('time')) {
          const timeIndex = parts.indexOf('time');
          if (timeIndex !== -1 && parts[timeIndex + 1]) {
            time = parseInt(parts[timeIndex + 1]);
          }
        }
      };

      const handleBestMove = (bestmove: string | boolean) => {
        if (typeof bestmove !== 'string') return;
        clearTimeout(timeout);
        this.pendingCallbacks.delete('info');
        this.pendingCallbacks.delete('bestmove');

        const parts = bestmove.split(' ');
        if (parts[1]) {
          bestMove = parts[1];
        }

        try {
          const chess = new Chess(fen);
          const moveObj = this.parseUciMove(chess, bestMove);

          resolve({
            bestMove: {
              uci: bestMove,
              san: moveObj?.san || bestMove,
              evaluation: evaluation,
              depth: analysisDepth,
              pv: [bestMove],
            },
            alternativeMoves: alternatives,
            evaluation: evaluation,
            depth: analysisDepth,
            time: time,
            nodes: nodes
          });
        } catch (error) {
          reject(error);
        }
      };

      this.pendingCallbacks.set('info', handleInfo);
      this.pendingCallbacks.set('bestmove', handleBestMove);

      // Set up position and start analysis
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`setoption name MultiPV value ${multipv}`);
      this.sendCommand(`go depth ${depth}`);
    });
  }

  private parseUciMove(chess: Chess, uci: string) {
    try {
      const from = uci.substring(0, 2);
      const to = uci.substring(2, 4);
      const promotion = uci.length === 5 ? uci[4] : undefined;

      return chess.move({
        from,
        to,
        promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined
      });
    } catch {
      return null;
    }
  }

  async getPositionEvaluation(fen: string, depth: number = 15): Promise<PositionAnalysis> {
    const result = await this.analyzePosition(fen, { depth });

    return {
      fen,
      evaluation: result.evaluation,
      bestMove: result.bestMove.uci,
      pv: result.bestMove.pv,
      depth: result.depth,
      mate: result.bestMove.mate
    };
  }

  async findBestMove(fen: string, timeMs?: number): Promise<string> {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCallbacks.delete('bestmove');
        reject(new Error('Best move search timeout'));
      }, timeMs || 5000);

      const handleBestMove = (bestmove: string | boolean) => {
        if (typeof bestmove !== 'string') return;
        clearTimeout(timeout);
        this.pendingCallbacks.delete('bestmove');

        const parts = bestmove.split(' ');
        if (parts[1]) {
          resolve(parts[1]);
        } else {
          reject(new Error('No best move found'));
        }
      };

      this.pendingCallbacks.set('bestmove', handleBestMove);

      this.sendCommand(`position fen ${fen}`);
      if (timeMs) {
        this.sendCommand(`go movetime ${timeMs}`);
      } else {
        this.sendCommand(`go depth 15`);
      }
    });
  }

  async isReady(): Promise<boolean> {
    if (!this.worker) return false;

    if (this.engineReady) {
      return true;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 2000);

      this.pendingCallbacks.set('ready', () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  destroy(): void {
    if (this.worker) {
      try {
        this.sendCommand('quit');
      } catch {
        // Ignore errors when quitting
      }

      // Terminate worker
      this.worker.terminate();
      this.worker = null;
    }
    this.engineReady = false;
    this.pendingCallbacks.clear();
  }
}

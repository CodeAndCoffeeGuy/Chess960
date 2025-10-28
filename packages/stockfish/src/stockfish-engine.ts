import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Chess } from 'chess.js';
import { AnalysisOptions, AnalysisResult, PositionAnalysis, AnalysisMove } from './types';

export class StockfishEngine extends EventEmitter {
  private process: ChildProcess | null = null;
  private engineReady = false;
  private currentAnalysis: Promise<AnalysisResult> | null = null;
  private responseBuffer = '';

  constructor() {
    super();
    this.initialize();
  }

  private initialize(): void {
    try {
      // Try to use stockfish from node_modules first, fallback to system stockfish
      this.process = spawn('node', ['-e', `
        const stockfish = require('stockfish');
        const engine = stockfish();
        
        process.stdin.on('data', (data) => {
          engine.postMessage(data.toString().trim());
        });
        
        engine.onmessage = (msg) => {
          process.stdout.write(msg.data + '\\n');
        };
        
        engine.postMessage('uci');
      `]);
    } catch {
      // Fallback to system stockfish
      this.process = spawn('stockfish');
      this.process.stdin?.write('uci\n');
    }

    if (!this.process) {
      throw new Error('Failed to start Stockfish engine');
    }

    this.process.stdout?.on('data', (data) => {
      this.handleEngineOutput(data.toString());
    });

    this.process.stderr?.on('data', (data) => {
      console.error('Stockfish error:', data.toString());
    });

    this.process.on('close', (code) => {
      console.log(`Stockfish process exited with code ${code}`);
      this.engineReady = false;
    });
  }

  private handleEngineOutput(output: string): void {
    this.responseBuffer += output;
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === 'uciok') {
        this.engineReady = true;
        this.emit('ready');
      } else if (trimmedLine.startsWith('info')) {
        this.emit('info', trimmedLine);
      } else if (trimmedLine.startsWith('bestmove')) {
        this.emit('bestmove', trimmedLine);
      }
    }
  }

  private sendCommand(command: string): void {
    if (!this.process || !this.process.stdin) {
      throw new Error('Stockfish engine not available');
    }
    this.process.stdin.write(command + '\n');
  }

  private waitForReady(): Promise<void> {
    if (this.engineReady) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.once('ready', resolve);
    });
  }

  async analyzePosition(fen: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    await this.waitForReady();

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
        reject(new Error('Analysis timeout'));
      }, options.time || 10000);

      const handleInfo = (info: string) => {
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

      const handleBestMove = (bestmove: string) => {
        clearTimeout(timeout);
        this.off('info', handleInfo);
        this.off('bestmove', handleBestMove);

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

      this.on('info', handleInfo);
      this.on('bestmove', handleBestMove);

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
    await this.waitForReady();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Best move search timeout'));
      }, timeMs || 5000);

      const handleBestMove = (bestmove: string) => {
        clearTimeout(timeout);
        this.off('bestmove', handleBestMove);

        const parts = bestmove.split(' ');
        if (parts[1]) {
          resolve(parts[1]);
        } else {
          reject(new Error('No best move found'));
        }
      };

      this.on('bestmove', handleBestMove);

      this.sendCommand(`position fen ${fen}`);
      if (timeMs) {
        this.sendCommand(`go movetime ${timeMs}`);
      } else {
        this.sendCommand(`go depth 15`);
      }
    });
  }

  async isReady(): Promise<boolean> {
    if (!this.process) return false;
    
    return new Promise((resolve) => {
      if (this.engineReady) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 1000);

      this.once('ready', () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  destroy(): void {
    if (this.process) {
      this.sendCommand('quit');
      this.process.kill();
      this.process = null;
    }
    this.engineReady = false;
    this.removeAllListeners();
  }
}
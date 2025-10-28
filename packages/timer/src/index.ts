/**
 * High-precision chess clock implementation for bullet games
 * Inspired by Chess960 timing precision
 */

export interface TimeControl {
  initial: number; // Initial time in milliseconds
  increment: number; // Increment per move in milliseconds
}

export interface ClockState {
  white: number;
  black: number;
  activeColor: 'white' | 'black' | null;
  lastUpdateTime: number;
}

export interface TimeUpdateCallback {
  (state: ClockState): void;
}

export interface TimeFlagCallback {
  (color: 'white' | 'black'): void;
}

/**
 * Precise chess clock using high-resolution timing
 */
export class ChessClock {
  private timeLeft: { white: number; black: number };
  private increment: { white: number; black: number };
  private activeColor: 'white' | 'black' | null = null;
  private lastStartTime: number = 0;
  private isPaused: boolean = true;
  private updateInterval: any = null;
  private updateCallbacks: TimeUpdateCallback[] = [];
  private flagCallbacks: TimeFlagCallback[] = [];
  private updateFrequency: number = 100; // Update every 100ms for smooth UI

  constructor(timeControl: TimeControl) {
    this.timeLeft = {
      white: timeControl.initial,
      black: timeControl.initial
    };
    this.increment = {
      white: timeControl.increment,
      black: timeControl.increment
    };
  }

  /**
   * Start the clock for the specified color
   */
  start(color: 'white' | 'black'): void {
    this.pause();
    this.activeColor = color;
    this.lastStartTime = this.getHighResTime();
    this.isPaused = false;
    this.startUpdateLoop();
  }

  /**
   * Pause the clock
   */
  pause(): void {
    if (!this.isPaused && this.activeColor) {
      this.updateActiveTime();
    }
    this.isPaused = true;
    this.activeColor = null;
    this.stopUpdateLoop();
  }

  /**
   * Make a move and switch clocks
   */
  makeMove(color: 'white' | 'black'): void {
    if (this.activeColor !== color) {
      throw new Error(`It's not ${color}'s turn`);
    }

    // Update time and add increment
    this.updateActiveTime();
    this.timeLeft[color] += this.increment[color];

    // Switch to opponent
    const nextColor = color === 'white' ? 'black' : 'white';
    this.start(nextColor);
  }

  /**
   * Get current time state
   */
  getState(): ClockState {
    const state: ClockState = {
      white: this.timeLeft.white,
      black: this.timeLeft.black,
      activeColor: this.activeColor,
      lastUpdateTime: this.getHighResTime()
    };

    // If clock is running, calculate real-time remaining
    if (!this.isPaused && this.activeColor) {
      const elapsed = this.getHighResTime() - this.lastStartTime;
      state[this.activeColor] = Math.max(0, this.timeLeft[this.activeColor] - elapsed);
    }

    return state;
  }

  /**
   * Add time update callback
   */
  onTimeUpdate(callback: TimeUpdateCallback): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Add time flag callback (when time runs out)
   */
  onTimeFlag(callback: TimeFlagCallback): void {
    this.flagCallbacks.push(callback);
  }

  /**
   * Remove callback
   */
  removeCallback(callback: TimeUpdateCallback | TimeFlagCallback): void {
    let index = this.updateCallbacks.indexOf(callback as TimeUpdateCallback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }

    index = this.flagCallbacks.indexOf(callback as TimeFlagCallback);
    if (index > -1) {
      this.flagCallbacks.splice(index, 1);
    }
  }

  /**
   * Set update frequency in milliseconds
   */
  setUpdateFrequency(ms: number): void {
    this.updateFrequency = Math.max(10, Math.min(1000, ms)); // Clamp between 10ms and 1s
    if (!this.isPaused) {
      this.stopUpdateLoop();
      this.startUpdateLoop();
    }
  }

  /**
   * Add time to a player (for time controls with delays)
   */
  addTime(color: 'white' | 'black', milliseconds: number): void {
    this.timeLeft[color] += milliseconds;
    this.notifyTimeUpdate();
  }

  /**
   * Check if game should end due to time
   */
  isTimeUp(): { white: boolean; black: boolean } {
    const state = this.getState();
    return {
      white: state.white <= 0,
      black: state.black <= 0
    };
  }

  /**
   * Destroy clock and cleanup
   */
  destroy(): void {
    this.stopUpdateLoop();
    this.updateCallbacks = [];
    this.flagCallbacks = [];
  }

  protected getHighResTime(): number {
    return Date.now(); // Can be enhanced with process.hrtime.bigint() for better precision
  }

  private updateActiveTime(): void {
    if (!this.isPaused && this.activeColor) {
      const elapsed = this.getHighResTime() - this.lastStartTime;
      this.timeLeft[this.activeColor] -= elapsed;
      this.lastStartTime = this.getHighResTime();

      // Check for time flag
      if (this.timeLeft[this.activeColor] <= 0) {
        this.timeLeft[this.activeColor] = 0;
        this.pause();
        this.notifyTimeFlag(this.activeColor);
      }
    }
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.notifyTimeUpdate();
    }, this.updateFrequency);
  }

  private stopUpdateLoop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private notifyTimeUpdate(): void {
    const state = this.getState();
    for (const callback of this.updateCallbacks) {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in time update callback:', error);
      }
    }
  }

  private notifyTimeFlag(color: 'white' | 'black'): void {
    for (const callback of this.flagCallbacks) {
      try {
        callback(color);
      } catch (error) {
        console.error('Error in time flag callback:', error);
      }
    }
  }
}

/**
 * Enhanced chess clock with network lag compensation
 */
export class NetworkAwareChessClock extends ChessClock {
  private lagCompensation: { white: number; black: number } = { white: 0, black: 0 };
  private moveTimestamps: Array<{ color: 'white' | 'black'; serverTime: number; clientTime: number }> = [];

  /**
   * Update lag compensation based on move timing
   */
  updateLagCompensation(color: 'white' | 'black', serverTime: number, clientTime: number): void {
    const lag = serverTime - clientTime;
    
    // Store move timestamp for analysis
    this.moveTimestamps.push({ color, serverTime, clientTime });
    
    // Keep only recent moves for lag calculation
    if (this.moveTimestamps.length > 10) {
      this.moveTimestamps.shift();
    }

    // Calculate average lag for this player
    const playerMoves = this.moveTimestamps.filter(m => m.color === color);
    if (playerMoves.length > 0) {
      const avgLag = playerMoves.reduce((sum, move) => 
        sum + (move.serverTime - move.clientTime), 0) / playerMoves.length;
      
      this.lagCompensation[color] = Math.max(0, Math.min(avgLag, 1000)); // Cap at 1 second
    }
  }

  /**
   * Make move with lag compensation
   */
  makeMoveWithLagCompensation(color: 'white' | 'black', clientTime: number): void {
    const serverTime = this.getHighResTime();
    this.updateLagCompensation(color, serverTime, clientTime);
    
    // Apply lag compensation by adding it back to the clock
    this.addTime(color, this.lagCompensation[color]);
    
    this.makeMove(color);
  }

  /**
   * Get lag compensation stats
   */
  getLagStats(): { white: number; black: number } {
    return { ...this.lagCompensation };
  }
}

/**
 * Time control presets for different game types
 */
export const TimeControlPresets = {
  BULLET_1_0: { initial: 60000, increment: 0 },
  BULLET_2_0: { initial: 120000, increment: 0 },
  BULLET_2_1: { initial: 120000, increment: 1000 },
  BLITZ_3_0: { initial: 180000, increment: 0 },
  BLITZ_3_2: { initial: 180000, increment: 2000 },
  BLITZ_5_0: { initial: 300000, increment: 0 },
  RAPID_10_0: { initial: 600000, increment: 0 },
  RAPID_15_10: { initial: 900000, increment: 10000 },
} as const;

// Export components
export * from './bullet-clock';

export { ChessClock as default };
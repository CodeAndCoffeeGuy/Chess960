/**
 * Advanced Chess Clock with lag compensation, emergency sounds, and visual feedback
 */

export interface BulletClockConfig {
  initial: number; // seconds
  increment: number; // seconds
  moretime?: number; // seconds for +15s button
}

export interface BulletClockData extends BulletClockConfig {
  running: boolean;
  white: number; // seconds
  black: number; // seconds
}

export interface ClockSetData {
  white: number; // seconds
  black: number; // seconds
  ticking: 'white' | 'black' | undefined;
  delay?: number; // network lag in centiseconds (1/100 second)
}

export interface ClockElements {
  time?: HTMLElement;
  clock?: HTMLElement;
  bar?: HTMLElement;
  barAnim?: Animation;
}

export interface EmergencySound {
  play(): void;
  next?: number;
  delay: number; // milliseconds
  playable: {
    white: boolean;
    black: boolean;
  };
}

interface Times {
  white: number; // milliseconds
  black: number; // milliseconds
  activeColor?: 'white' | 'black';
  lastUpdate: number; // milliseconds
}

export interface ClockOptions {
  onFlag(): void;
  bothPlayersHavePlayed(): boolean;
  hasGoneBerserk?(color: 'white' | 'black'): boolean;
  soundColor?: 'white' | 'black';
  onTick?: (color: 'white' | 'black', millis: number) => void;
}

export class BulletClock {
  private emergSound: EmergencySound = {
    play: () => {
      // Play low time warning sound
      if (typeof Audio !== 'undefined') {
        try {
          const audio = new Audio('/sounds/lowTime.ogg');
          audio.play().catch(() => {
            // Fallback to system beep or silent fail
            console.log('🔊 Low time warning!');
          });
        } catch (e) {
          console.log('🔊 Low time warning!');
        }
      }
    },
    delay: 20000, // 20 seconds between emergency sounds
    playable: {
      white: true,
      black: true,
    },
  };

  private showTenths: (millis: number) => boolean;
  private showBar: boolean;
  private times: Times = {
    white: 60000,
    black: 60000,
    lastUpdate: 0
  };
  private barTime: number;
  private timeRatioDivisor: number;
  private emergMs: number; // Emergency threshold in milliseconds
  private elements: { white: ClockElements; black: ClockElements } = {
    white: {},
    black: {},
  };
  private tickTimeout?: number;

  constructor(
    data: BulletClockData,
    private opts: ClockOptions,
    showTenthsMode: 'never' | 'below10' | 'below60' = 'below10',
    showClockBar: boolean = true
  ) {
    // Configure when to show tenths of seconds
    this.showTenths =
      showTenthsMode === 'never'
        ? () => false
        : showTenthsMode === 'below10'
          ? time => time < 10000
          : time => time < 60000;

    this.showBar = showClockBar;
    this.barTime = 1000 * (Math.max(data.initial, 2) + 5 * data.increment);
    this.timeRatioDivisor = 1 / this.barTime;

    // Emergency sound threshold: 1/8 of initial time, min 10s, max 60s
    this.emergMs = 1000 * Math.min(60, Math.max(10, data.initial * 0.125));

    this.setClock({
      white: data.white,
      black: data.black,
      ticking: (data as any).ticking || (data.running ? 'white' : undefined),
    });
  }

  /**
   * Calculate time ratio for progress bar (0.0 to 1.0)
   */
  timeRatio(millis: number): number {
    return Math.min(1, millis * this.timeRatioDivisor);
  }

  /**
   * Set clock state with lag compensation
   */
  setClock(data: ClockSetData): void {
    const delayMs = (data.delay || 0) * 10; // Convert centiseconds to ms

    this.times = {
      white: data.white * 1000,
      black: data.black * 1000,
      activeColor: data.ticking,
      lastUpdate: performance.now() + delayMs, // Add lag compensation
    };

    if (data.ticking) {
      this.scheduleTick(this.times[data.ticking], delayMs);
    }
  }

  /**
   * Add time to a player (for +15s button or increment)
   */
  addTime(color: 'white' | 'black', centiseconds: number): void {
    this.times[color] += centiseconds * 10; // Convert to milliseconds
    this.updateElements(color);
  }

  /**
   * Stop the currently running clock
   */
  stopClock(): number | void {
    const color = this.times.activeColor;
    if (color) {
      const elapsed = this.getElapsed();
      this.times[color] = Math.max(0, this.times[color] - elapsed);
      this.times.activeColor = undefined;
      this.clearTickTimeout();
      return elapsed;
    }
  }

  /**
   * Force stop clock (emergency stop)
   */
  hardStopClock(): void {
    this.times.activeColor = undefined;
    this.clearTickTimeout();
  }

  /**
   * Schedule next tick with precise timing
   */
  private scheduleTick(time: number, extraDelay: number): void {
    this.clearTickTimeout();
    
    // Calculate next tick interval
    let nextTick: number;
    if (this.showTenths(time)) {
      nextTick = (time % 100) + 1; // Update every 0.1s when showing tenths
    } else {
      nextTick = (time % 500) + 1; // Update every 0.5s normally
    }
    
    this.tickTimeout = window.setTimeout(() => {
      this.tick();
    }, nextTick + extraDelay);
  }

  /**
   * Main tick function - handles time updates and sound
   */
  private tick(): void {
    this.tickTimeout = undefined;

    const color = this.times.activeColor;
    if (!color) return;

    const now = performance.now();
    const millis = Math.max(0, this.times[color] - this.getElapsed(now));

    this.scheduleTick(millis, 0);

    // Check for time flag (0 seconds remaining)
    if (millis === 0) {
      this.opts.onFlag();
      return;
    }

    // Update UI elements
    this.updateElements(color, millis);

    // Handle emergency sound
    this.handleEmergencySound(color, millis, now);

    // Notify callback if provided
    if (this.opts.onTick) {
      this.opts.onTick(color, millis);
    }
  }

  /**
   * Handle emergency sound when time is low
   */
  private handleEmergencySound(color: 'white' | 'black', millis: number, now: number): void {
    if (this.opts.soundColor !== color) return;

    if (this.emergSound.playable[color]) {
      if (millis < this.emergMs && (!this.emergSound.next || now >= this.emergSound.next)) {
        this.emergSound.play();
        this.emergSound.next = now + this.emergSound.delay;
        this.emergSound.playable[color] = false;
      }
    } else if (millis > 1.5 * this.emergMs) {
      // Re-enable sound when time goes back above threshold
      this.emergSound.playable[color] = true;
    }
  }

  /**
   * Update DOM elements with current time
   */
  private updateElements(color: 'white' | 'black', millis?: number): void {
    if (!millis) {
      millis = this.millisOf(color);
    }

    const elements = this.elements[color];
    
    // Update time display
    if (elements.time) {
      elements.time.textContent = this.formatTime(millis);
    }

    // Update progress bar
    if (elements.bar && this.showBar) {
      const ratio = this.timeRatio(millis);
      elements.bar.style.transform = `scaleX(${ratio})`;
      
      // Add emergency styling when time is low
      if (millis < this.emergMs) {
        elements.bar.classList.add('emergency');
        elements.clock?.classList.add('emergency');
      } else {
        elements.bar.classList.remove('emergency');
        elements.clock?.classList.remove('emergency');
      }
    }
  }

  /**
   * Format time for display (MM:SS or MM:SS.t)
   */
  private formatTime(millis: number): string {
    const totalSeconds = Math.ceil(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    let formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Add tenths if needed
    if (this.showTenths(millis)) {
      const tenths = Math.floor((millis % 1000) / 100);
      formatted += `.${tenths}`;
    }
    
    return formatted;
  }

  /**
   * Get elapsed time since last update
   */
  private getElapsed(now: number = performance.now()): number {
    return Math.max(0, now - this.times.lastUpdate);
  }

  /**
   * Get current milliseconds for a color
   */
  millisOf(color: 'white' | 'black'): number {
    return this.times.activeColor === color 
      ? Math.max(0, this.times[color] - this.getElapsed())
      : this.times[color];
  }

  /**
   * Check if clock is currently running
   */
  isRunning(): boolean {
    return this.times.activeColor !== undefined;
  }

  /**
   * Set DOM elements for updates
   */
  setElements(color: 'white' | 'black', elements: ClockElements): void {
    this.elements[color] = elements;
  }

  /**
   * Speak current time (accessibility)
   */
  speak(): void {
    const whiteTime = this.formatTime(this.millisOf('white'));
    const blackTime = this.formatTime(this.millisOf('black'));
    
    const message = `White: ${whiteTime}. Black: ${blackTime}`;
    
    // Use Speech API if available
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.2;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      console.log(`🔊 ${message}`);
    }
  }

  /**
   * Clear tick timeout
   */
  private clearTickTimeout(): void {
    if (this.tickTimeout !== undefined) {
      clearTimeout(this.tickTimeout);
      this.tickTimeout = undefined;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearTickTimeout();
  }
}
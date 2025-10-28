/**
 * Advanced Lag Detection and Compensation System
 * For real-time game connections and move timing analysis
 */

export interface LagMeasurement {
  userId: string;
  timestamp: number;
  rtt: number; // Round-trip time in milliseconds
  serverTime: number;
  clientTime: number;
}

export interface LagStats {
  userId: string;
  averageLag: number;
  medianLag: number;
  p95Lag: number; // 95th percentile
  jitter: number; // Variance in lag
  rating: 1 | 2 | 3 | 4; // Signal quality rating (1=poor, 4=excellent)
  measurementCount: number;
  lastMeasurement: number;
}

export interface MoveMetrics {
  lag: number; // Network lag in centiseconds
  moveTime: number; // Time spent thinking in centiseconds  
  firstMove: number; // Time from request to first move in centiseconds
}

export class LagDetector {
  private measurements = new Map<string, LagMeasurement[]>();
  private readonly maxMeasurements = 50;
  private readonly measurementWindow = 15 * 60 * 1000; // 15 minutes
  
  /**
   * Record a lag measurement for a user
   */
  recordMeasurement(measurement: LagMeasurement): void {
    if (!this.measurements.has(measurement.userId)) {
      this.measurements.set(measurement.userId, []);
    }
    
    const userMeasurements = this.measurements.get(measurement.userId)!;
    userMeasurements.push(measurement);
    
    // Keep only recent measurements
    const cutoff = Date.now() - this.measurementWindow;
    const filtered = userMeasurements
      .filter(m => m.timestamp > cutoff)
      .slice(-this.maxMeasurements);
    
    this.measurements.set(measurement.userId, filtered);
  }

  /**
   * Record move timing for lag analysis
   */
  recordMove(userId: string, metrics: MoveMetrics, serverTime: number): void {
    // Convert centiseconds to milliseconds for consistency
    const lagMs = metrics.lag * 10;
    
    this.recordMeasurement({
      userId,
      timestamp: Date.now(),
      rtt: lagMs,
      serverTime,
      clientTime: serverTime - lagMs
    });
  }

  /**
   * Calculate comprehensive lag statistics for a user
   */
  getLagStats(userId: string): LagStats | null {
    const measurements = this.measurements.get(userId);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const lags = measurements.map(m => m.rtt).sort((a, b) => a - b);
    const count = lags.length;
    
    // Calculate statistics
    const averageLag = lags.reduce((sum, lag) => sum + lag, 0) / count;
    const medianLag = count % 2 === 0 
      ? (lags[count / 2 - 1] + lags[count / 2]) / 2
      : lags[Math.floor(count / 2)];
    const p95Lag = lags[Math.floor(count * 0.95)];
    
    // Calculate jitter (standard deviation)
    const variance = lags.reduce((sum, lag) => sum + Math.pow(lag - averageLag, 2), 0) / count;
    const jitter = Math.sqrt(variance);
    
    // Calculate signal quality rating
    const rating = this.calculateSignalRating(averageLag);
    
    return {
      userId,
      averageLag,
      medianLag,
      p95Lag,
      jitter,
      rating,
      measurementCount: count,
      lastMeasurement: measurements[measurements.length - 1].timestamp
    };
  }

  /**
   * Calculate signal quality rating
   * 1 = poor (>500ms), 2 = fair (150-500ms), 3 = good (50-150ms), 4 = excellent (<50ms)
   */
  private calculateSignalRating(averageLag: number): 1 | 2 | 3 | 4 {
    if (averageLag <= 50) return 4;
    if (averageLag <= 150) return 3;
    if (averageLag <= 500) return 2;
    return 1;
  }

  /**
   * Get lag compensation for a move
   * Returns milliseconds to add back to the player's clock
   */
  getLagCompensation(userId: string, moveMetrics?: MoveMetrics): number {
    const stats = this.getLagStats(userId);
    if (!stats) return 0;

    // Use p95 lag for compensation to avoid abuse
    let compensation = Math.min(stats.p95Lag, 1000); // Max 1 second compensation
    
    // For very fast bullet moves, be more generous
    if (moveMetrics && moveMetrics.moveTime < 50) { // Less than 0.5 seconds thinking
      compensation = Math.min(stats.averageLag, 500);
    }
    
    // Reduce compensation for consistently laggy connections (possible abuse)
    if (stats.averageLag > 300) {
      compensation *= 0.5;
    }
    
    return Math.round(compensation);
  }

  /**
   * Check if a user's connection is stable enough for bullet games
   */
  isStableForBullet(userId: string): { stable: boolean; reason?: string } {
    const stats = this.getLagStats(userId);
    if (!stats) {
      return { stable: false, reason: 'No connection data available' };
    }

    // Too high average lag
    if (stats.averageLag > 200) {
      return { stable: false, reason: `High lag: ${Math.round(stats.averageLag)}ms average` };
    }

    // Too much jitter (unstable connection)
    if (stats.jitter > 100) {
      return { stable: false, reason: `Unstable connection: ${Math.round(stats.jitter)}ms jitter` };
    }

    // P95 lag too high (worst case scenarios)
    if (stats.p95Lag > 500) {
      return { stable: false, reason: `Unreliable connection: ${Math.round(stats.p95Lag)}ms worst case` };
    }

    return { stable: true };
  }

  /**
   * Get all users with their lag stats
   */
  getAllStats(): LagStats[] {
    const stats: LagStats[] = [];
    for (const userId of this.measurements.keys()) {
      const userStats = this.getLagStats(userId);
      if (userStats) {
        stats.push(userStats);
      }
    }
    return stats.sort((a, b) => a.averageLag - b.averageLag);
  }

  /**
   * Clean up old measurements
   */
  cleanup(): void {
    const cutoff = Date.now() - this.measurementWindow;
    
    for (const [userId, measurements] of this.measurements.entries()) {
      const filtered = measurements.filter(m => m.timestamp > cutoff);
      
      if (filtered.length === 0) {
        this.measurements.delete(userId);
      } else {
        this.measurements.set(userId, filtered);
      }
    }
  }

  /**
   * Export lag data for analysis
   */
  exportData(): { [userId: string]: LagMeasurement[] } {
    const data: { [userId: string]: LagMeasurement[] } = {};
    for (const [userId, measurements] of this.measurements.entries()) {
      data[userId] = [...measurements];
    }
    return data;
  }

  /**
   * Get connection quality summary for monitoring
   */
  getConnectionSummary(): {
    totalUsers: number;
    averageRating: number;
    distribution: { rating: number; count: number; percentage: number }[];
  } {
    const allStats = this.getAllStats();
    const totalUsers = allStats.length;
    
    if (totalUsers === 0) {
      return {
        totalUsers: 0,
        averageRating: 0,
        distribution: []
      };
    }

    const averageRating = allStats.reduce((sum, stats) => sum + stats.rating, 0) / totalUsers;
    
    // Calculate distribution
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    allStats.forEach(stats => counts[stats.rating]++);
    
    const distribution = [1, 2, 3, 4].map(rating => ({
      rating,
      count: counts[rating as keyof typeof counts],
      percentage: Math.round((counts[rating as keyof typeof counts] / totalUsers) * 100)
    }));

    return {
      totalUsers,
      averageRating: Math.round(averageRating * 100) / 100,
      distribution
    };
  }

  /**
   * Detect potential lag manipulation
   */
  detectAbusePatterns(userId: string): { 
    suspicious: boolean; 
    patterns: string[];
    confidence: number; 
  } {
    const measurements = this.measurements.get(userId);
    if (!measurements || measurements.length < 10) {
      return { suspicious: false, patterns: [], confidence: 0 };
    }

    const patterns: string[] = [];
    let suspicionScore = 0;

    // Pattern 1: Sudden lag spikes during losing positions
    const lags = measurements.map(m => m.rtt);
    const avgLag = lags.reduce((sum, lag) => sum + lag, 0) / lags.length;
    const spikes = lags.filter(lag => lag > avgLag * 3).length;
    
    if (spikes > measurements.length * 0.1) {
      patterns.push('Frequent lag spikes');
      suspicionScore += 30;
    }

    // Pattern 2: Extremely inconsistent lag
    const sorted = [...lags].sort((a, b) => a - b);
    const ratio = sorted[sorted.length - 1] / Math.max(sorted[0], 1);
    
    if (ratio > 20) {
      patterns.push('Highly inconsistent connection');
      suspicionScore += 25;
    }

    // Pattern 3: Too perfect consistency (bot-like)
    const variance = lags.reduce((sum, lag) => sum + Math.pow(lag - avgLag, 2), 0) / lags.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 5 && avgLag > 50) {
      patterns.push('Unnaturally consistent lag');
      suspicionScore += 40;
    }

    const confidence = Math.min(suspicionScore, 100);
    
    return {
      suspicious: confidence > 60,
      patterns,
      confidence
    };
  }
}

export default LagDetector;
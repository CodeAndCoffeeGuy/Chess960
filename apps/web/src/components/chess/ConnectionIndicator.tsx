'use client';

import React, { useState, useEffect } from 'react';
import { LagDetector, type LagStats } from '@chess960/redis-client';

interface ConnectionIndicatorProps {
  userId: string;
  lagDetector: LagDetector;
  showDetails?: boolean;
  className?: string;
}

interface ConnectionState {
  signal: 1 | 2 | 3 | 4;
  averageLag: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  icon: string;
}

export function ConnectionIndicator({
  userId,
  lagDetector,
  showDetails = false,
  className = ''
}: ConnectionIndicatorProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    signal: 4,
    averageLag: 0,
    status: 'excellent',
    color: '#4caf50',
    icon: '📶'
  });

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const updateConnection = () => {
      const stats = lagDetector.getLagStats(userId);
      if (stats) {
        const state = getConnectionState(stats);
        setConnectionState(state);
      }
    };

    // Update immediately
    updateConnection();

    // Update every 5 seconds
    const interval = setInterval(updateConnection, 5000);

    return () => clearInterval(interval);
  }, [userId, lagDetector]);

  function getConnectionState(stats: LagStats): ConnectionState {
    const rating = stats.rating;
    
    switch (rating) {
      case 4:
        return {
          signal: 4,
          averageLag: stats.averageLag,
          status: 'excellent',
          color: '#4caf50',
          icon: '📶'
        };
      case 3:
        return {
          signal: 3,
          averageLag: stats.averageLag,
          status: 'good',
          color: '#8bc34a',
          icon: '📶'
        };
      case 2:
        return {
          signal: 2,
          averageLag: stats.averageLag,
          status: 'fair',
          color: '#ff9800',
          icon: '📶'
        };
      case 1:
        return {
          signal: 1,
          averageLag: stats.averageLag,
          status: 'poor',
          color: '#f44336',
          icon: '📶'
        };
      default:
        return {
          signal: 4,
          averageLag: 0,
          status: 'excellent',
          color: '#4caf50',
          icon: '📶'
        };
    }
  }

  const indicatorStyle = {
    color: connectionState.color,
  };

  const tooltipContent = (
    <div className="connection-tooltip">
      <div className="connection-tooltip__header">
        <span className="connection-tooltip__status">
          {connectionState.status.toUpperCase()} CONNECTION
        </span>
        <span className="connection-tooltip__signal">
          {Array.from({ length: 4 }, (_, i) => (
            <span
              key={i}
              className={`signal-bar ${i < connectionState.signal ? 'active' : ''}`}
              style={i < connectionState.signal ? indicatorStyle : {}}
            >
              ▁
            </span>
          ))}
        </span>
      </div>
      <div className="connection-tooltip__details">
        <div>Avg Lag: {Math.round(connectionState.averageLag)}ms</div>
        <div>Quality: {connectionState.signal}/4</div>
      </div>
    </div>
  );

  return (
    <div
      className={`connection-indicator ${className} bg-[#2a2926] border border-[#454038] rounded-md px-2 py-1 shadow-[0_6px_16px_rgba(0,0,0,0.25)] inline-flex items-center gap-2`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Status dot */}
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: connectionState.color }}
        aria-hidden
      />

      {/* Signal Bars */}
      <div className="connection-indicator__bars">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`connection-bar ${i < connectionState.signal ? 'active' : ''}`}
            style={{
              backgroundColor: i < connectionState.signal ? connectionState.color : '#5a5750',
              height: `${(i + 1) * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Compact label */}
      <span className="text-[11px] leading-none text-[#c1b9ad]">
        {connectionState.status}
      </span>

      {/* Lag Display (optional extended) */}
      {showDetails && (
        <div className="connection-indicator__lag" style={indicatorStyle}>
          {Math.round(connectionState.averageLag)}ms
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="connection-indicator__tooltip">
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

// Connection Quality Component
export function ConnectionQuality({
  userId,
  lagDetector,
  compact = false
}: {
  userId: string;
  lagDetector: LagDetector;
  compact?: boolean;
}) {
  const [stats, setStats] = useState<LagStats | null>(null);
  const [isStable, setIsStable] = useState(true);

  useEffect(() => {
    const updateStats = () => {
      const currentStats = lagDetector.getLagStats(userId);
      setStats(currentStats);
      
      if (currentStats) {
        const stability = lagDetector.isStableForBullet(userId);
        setIsStable(stability.stable);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [userId, lagDetector]);

  if (!stats) {
    return (
      <div className="connection-quality connection-quality--unknown">
        <span className="connection-quality__icon">❓</span>
        <span className="connection-quality__text">Unknown</span>
      </div>
    );
  }

  const qualityClass = `connection-quality--${stats.rating}`;
  const qualityText = ['Poor', 'Fair', 'Good', 'Excellent'][stats.rating - 1];
  const qualityIcon = ['🔴', '🟡', '🟢', '🟢'][stats.rating - 1];

  if (compact) {
    return (
      <div className={`connection-quality-compact ${qualityClass}`}>
        <span title={`${qualityText}: ${Math.round(stats.averageLag)}ms avg lag`}>
          {qualityIcon}
        </span>
      </div>
    );
  }

  return (
    <div className={`connection-quality ${qualityClass}`}>
      <div className="connection-quality__indicator">
        <span className="connection-quality__icon">{qualityIcon}</span>
        <div className="connection-quality__bars">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={`quality-bar ${i < stats.rating ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
      
      <div className="connection-quality__details">
        <div className="connection-quality__status">{qualityText}</div>
        <div className="connection-quality__lag">
          {Math.round(stats.averageLag)}ms avg
        </div>
        
        {!isStable && (
          <div className="connection-quality__warning">
            ⚠️ May not be suitable for bullet games
          </div>
        )}
      </div>
    </div>
  );
}

// CSS Styles
export const connectionStyles = `
.connection-indicator {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.connection-indicator:hover {
  background: rgba(0, 0, 0, 0.15);
}

.connection-indicator__bars {
  display: flex;
  gap: 1px;
  align-items: end;
}

.connection-bar {
  width: 3px;
  background: #ccc;
  border-radius: 0.5px;
  transition: all 0.2s ease;
}

.connection-bar.active {
  animation: signal-pulse 2s infinite;
}

.connection-indicator__lag {
  font-size: 0.8rem;
  font-weight: bold;
  font-family: 'Roboto Mono', monospace;
}

.connection-indicator__tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  z-index: 1000;
}

.connection-tooltip {
  background: #333;
  color: white;
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 0.8rem;
  white-space: nowrap;
}

.connection-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #333;
}

.connection-tooltip__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  gap: 12px;
}

.connection-tooltip__status {
  font-weight: bold;
  font-size: 0.7rem;
}

.connection-tooltip__signal {
  display: flex;
  gap: 1px;
}

.signal-bar {
  font-size: 12px;
  opacity: 0.3;
}

.signal-bar.active {
  opacity: 1;
}

.connection-tooltip__details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.75rem;
  opacity: 0.9;
}

.connection-quality {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.connection-quality--1 {
  border-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.connection-quality--2 {
  border-color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.connection-quality--3 {
  border-color: #8bc34a;
  background: rgba(139, 195, 74, 0.1);
}

.connection-quality--4 {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.connection-quality__indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.connection-quality__icon {
  font-size: 1.2rem;
}

.connection-quality__bars {
  display: flex;
  gap: 1px;
  align-items: end;
}

.quality-bar {
  width: 2px;
  height: 8px;
  background: #ccc;
  border-radius: 1px;
}

.quality-bar:nth-child(2) { height: 10px; }
.quality-bar:nth-child(3) { height: 12px; }
.quality-bar:nth-child(4) { height: 14px; }

.connection-quality--1 .quality-bar.active { background: #f44336; }
.connection-quality--2 .quality-bar.active { background: #ff9800; }
.connection-quality--3 .quality-bar.active { background: #8bc34a; }
.connection-quality--4 .quality-bar.active { background: #4caf50; }

.connection-quality__details {
  flex: 1;
  min-width: 0;
}

.connection-quality__status {
  font-weight: bold;
  font-size: 0.9rem;
}

.connection-quality__lag {
  font-size: 0.8rem;
  opacity: 0.7;
  font-family: 'Roboto Mono', monospace;
}

.connection-quality__warning {
  font-size: 0.75rem;
  color: #ff9800;
  margin-top: 2px;
}

.connection-quality-compact {
  display: inline-block;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9rem;
}

@keyframes signal-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (max-width: 768px) {
  .connection-indicator {
    padding: 2px 6px;
    gap: 4px;
  }
  
  .connection-quality {
    padding: 4px 8px;
    gap: 6px;
  }
  
  .connection-quality__details {
    font-size: 0.8rem;
  }
}
`;

export default ConnectionIndicator;
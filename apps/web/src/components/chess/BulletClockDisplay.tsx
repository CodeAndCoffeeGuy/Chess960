'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BulletClock, type BulletClockData, type ClockElements } from '@chess960/timer';

interface ClockDisplayProps {
  initialData: BulletClockData;
  color: 'white' | 'black';
  position: 'top' | 'bottom';
  showTenths?: 'never' | 'below10' | 'below60';
  showBar?: boolean;
  isPlayer?: boolean;
  onFlag?: () => void;
  onTick?: (color: 'white' | 'black', millis: number) => void;
}

interface ClockState {
  time: string;
  millis: number;
  isEmergency: boolean;
  isRunning: boolean;
}

export function BulletClockDisplay({
  initialData,
  color,
  position,
  showTenths = 'below10',
  showBar = true,
  isPlayer = false,
  onFlag,
  onTick
}: ClockDisplayProps) {
  const clockRef = useRef<BulletClock | null>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const clockElementRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const [clockState, setClockState] = useState<ClockState>({
    time: formatTime(initialData[color] * 1000),
    millis: initialData[color] * 1000,
    isEmergency: false,
    isRunning: false
  });

  useEffect(() => {
    // Create clock instance
    clockRef.current = new BulletClock(
      initialData,
      {
        onFlag: () => {
          onFlag?.();
        },
        bothPlayersHavePlayed: () => true,
        onTick: (tickColor, millis) => {
          if (tickColor === color) {
            const emergencyThreshold = Math.min(60000, Math.max(10000, initialData.initial * 0.125 * 1000));
            setClockState({
              time: formatTime(millis, millis < 10000 && showTenths !== 'never'),
              millis,
              isEmergency: millis < emergencyThreshold,
              isRunning: true
            });
          }
          onTick?.(tickColor, millis);
        }
      },
      showTenths,
      showBar
    );

    // Set DOM elements for the clock
    const elements: ClockElements = {
      time: timeRef.current || undefined,
      clock: clockElementRef.current || undefined,
      bar: barRef.current || undefined
    };

    clockRef.current.setElements(color, elements);

    return () => {
      clockRef.current?.destroy();
    };
  }, []);

  // Update clock when initialData changes
  useEffect(() => {
    if (clockRef.current && initialData) {
      clockRef.current.setClock({
        white: initialData.white,
        black: initialData.black,
        ticking: (initialData as any).ticking, // Use ticking from updated data
      });
      
      // Also update local state immediately
      const emergencyThreshold = Math.min(60000, Math.max(10000, initialData.initial * 0.125 * 1000));
      const millis = initialData[color] * 1000;
      setClockState({
        time: formatTime(millis, millis < 10000 && showTenths !== 'never'),
        millis,
        isEmergency: millis < emergencyThreshold,
        isRunning: (initialData as any).ticking === color
      });
    }
  }, [initialData, color, showTenths]);

  // Format time display
  function formatTime(millis: number, showDecimal = false): string {
    const totalSeconds = Math.ceil(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    let formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (showDecimal && millis < 10000) {
      const tenths = Math.floor((millis % 1000) / 100);
      formatted += `.${tenths}`;
    }
    
    return formatted;
  }

  const clockClasses = [
    'bullet-clock',
    `bullet-clock--${color}`,
    `bullet-clock--${position}`,
    clockState.isRunning && 'bullet-clock--running',
    clockState.isEmergency && 'bullet-clock--emergency',
    isPlayer && 'bullet-clock--player'
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={clockElementRef}
      className={clockClasses}
    >
      {/* Progress Bar */}
      {showBar && (
        <div className="bullet-clock__bar-container">
          <div 
            ref={barRef}
            className="bullet-clock__bar"
            style={{
              transformOrigin: color === 'white' ? 'left' : 'right'
            }}
          />
        </div>
      )}
      
      {/* Time Display */}
      <div 
        ref={timeRef}
        className="bullet-clock__time"
      >
        {clockState.time}
      </div>

      {/* Emergency Warning */}
      {clockState.isEmergency && (
        <div className="bullet-clock__emergency-indicator">
          !
        </div>
      )}

      {/* Player Indicator */}
      {isPlayer && (
        <div className="bullet-clock__player-indicator">
          YOU
        </div>
      )}
    </div>
  );
}

// CSS styles (to be added to your global CSS)
export const bulletClockStyles = `
.bullet-clock {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2c2c2c;
  color: #ffffff;
  border-radius: 8px;
  min-height: 60px;
  min-width: 120px;
  font-family: 'Roboto Mono', monospace;
  font-weight: bold;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.bullet-clock--white {
  background: #f0f0f0;
  color: #333333;
}

.bullet-clock--black {
  background: #2c2c2c;
  color: #ffffff;
}

.bullet-clock--running {
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
  animation: pulse 2s infinite;
}

.bullet-clock--emergency {
  background: #f44336 !important;
  color: #ffffff !important;
  animation: emergency-flash 1s infinite;
}

.bullet-clock--player {
  border: 2px solid #4caf50;
}

.bullet-clock__time {
  font-size: 1.8rem;
  font-weight: bold;
  z-index: 2;
  position: relative;
}

.bullet-clock__bar-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-radius: 0 0 8px 8px;
}

.bullet-clock__bar {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: transform 0.1s linear;
  transform-origin: left;
}

.bullet-clock--emergency .bullet-clock__bar {
  background: linear-gradient(90deg, #ff5722, #f44336);
}

.bullet-clock__emergency-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.8rem;
  animation: blink 1s infinite;
}

.bullet-clock__player-indicator {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  font-weight: bold;
  letter-spacing: 1px;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(76, 175, 80, 0.5); }
  50% { box-shadow: 0 0 25px rgba(76, 175, 80, 0.8); }
}

@keyframes emergency-flash {
  0%, 100% { background-color: #f44336; }
  50% { background-color: #d32f2f; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.bullet-clock--top {
  transform: rotate(180deg);
}

.bullet-clock--top .bullet-clock__time,
.bullet-clock--top .bullet-clock__emergency-indicator,
.bullet-clock--top .bullet-clock__player-indicator {
  transform: rotate(180deg);
}

/* Responsive design */
@media (max-width: 768px) {
  .bullet-clock {
    min-height: 50px;
    min-width: 100px;
  }
  
  .bullet-clock__time {
    font-size: 1.4rem;
  }
}
`;

export default BulletClockDisplay;
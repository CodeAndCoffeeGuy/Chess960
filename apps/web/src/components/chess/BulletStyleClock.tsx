'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ClockProps {
  millis: number;
  color: 'white' | 'black';
  position: 'top' | 'bottom';
  running?: boolean;
  showBar?: boolean;
  onFlag?: () => void;
}

export function BulletStyleClock({
  millis,
  color: _color,
  position: _position,
  running = false,
  showBar = true,
  onFlag
}: ClockProps) {
  const [currentTime, setCurrentTime] = useState(millis);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Emergency threshold (10 seconds or 12.5% of initial time, whichever is higher)
  const emergencyThreshold = Math.max(10000, millis * 0.125);
  const isEmergency = currentTime <= emergencyThreshold;
  const isOutOfTime = currentTime <= 0;

  useEffect(() => {
    setCurrentTime(millis);
  }, [millis]);

  useEffect(() => {
    if (running && currentTime > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = Math.max(0, prev - 100); // Update every 100ms
          if (newTime <= 0 && onFlag) {
            onFlag();
          }
          return newTime;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, currentTime, onFlag]);

  // Update bar
  useEffect(() => {
    if (barRef.current && showBar) {
      const ratio = Math.max(0, Math.min(1, currentTime / millis));
      barRef.current.style.transform = `scale(${ratio}, 1)`;
    }
  }, [currentTime, millis, showBar]);

  const formatTime = (time: number): string => {
    // Safety: clamp negative time to 0
    const safeTime = Math.max(0, time);
    const totalSeconds = Math.floor(safeTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((safeTime % 1000) / 100);

    const showTenths = safeTime < 10000;
    const isRunning = running && safeTime > 0;

    const sepClass = isRunning && (safeTime % 1000) < 500 ? 'low' : '';
    const sep = `<sep class="${sepClass}">:</sep>`;

    let baseStr = `${minutes.toString().padStart(2, '0')}${sep}${seconds.toString().padStart(2, '0')}`;

    if (safeTime >= 3600000) {
      const hours = Math.floor(safeTime / 3600000);
      baseStr = `${hours.toString().padStart(2, '0')}${sep}${baseStr}`;
    }
    
    if (showTenths) {
      baseStr += `<tenths><sep>.</sep>${tenths}</tenths>`;
    }
    
    return baseStr;
  };

  return (
    <div className="relative">
      <div className="inline-flex items-center justify-center">
        <div
          className={`font-mono text-lg font-bold px-3 py-1 transition-colors ${
            isOutOfTime 
              ? 'text-red-500 bg-red-500/20' 
              : isEmergency 
                ? 'text-orange-400 bg-orange-400/20' 
                : 'text-white'
          }`}
          dangerouslySetInnerHTML={{ __html: formatTime(currentTime).replace(/<sep[^>]*>:/g, ':').replace(/<\/?sep>/g, '').replace(/<\/?tenths>/g, '') }}
        />
      </div>
    </div>
  );
}
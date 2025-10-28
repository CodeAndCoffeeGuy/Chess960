'use client';

import React, { useMemo } from 'react';

interface AccuracyGraphProps {
  moves: Array<{
    ply: number;
    accuracy?: {
      accuracy: number;
      classification: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
      winPercent: number;
    };
    evaluation: {
      cp?: number;
      mate?: number;
    };
  }>;
  width?: number;
  height?: number;
  className?: string;
}

export const AccuracyGraph: React.FC<AccuracyGraphProps> = ({
  moves,
  width = 600,
  height = 200,
  className
}) => {
  const data = useMemo(() => {
    const whitePoints: Array<{ x: number; y: number; accuracy: number; classification: string }> = [];
    const blackPoints: Array<{ x: number; y: number; accuracy: number; classification: string }> = [];

    moves.forEach((move, index) => {
      if (!move.accuracy) return;

      const x = (index / (moves.length - 1)) * (width - 40);
      const y = height - 40 - ((move.accuracy.accuracy / 100) * (height - 60));
      
      const point = {
        x: x + 20,
        y: y + 20,
        accuracy: move.accuracy.accuracy,
        classification: move.accuracy.classification
      };

      if (index % 2 === 0) {
        whitePoints.push(point);
      } else {
        blackPoints.push(point);
      }
    });

    return { whitePoints, blackPoints };
  }, [moves, width, height]);

  const getClassificationColor = (classification: string): string => {
    switch (classification) {
      case 'excellent': return '#27ae60';
      case 'good': return '#3498db';
      case 'inaccuracy': return '#f39c12';
      case 'mistake': return '#e67e22';
      case 'blunder': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const createPath = (points: Array<{ x: number; y: number }>): string => {
    if (points.length < 2) return '';
    
    return points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${path} L ${point.x} ${point.y}`;
    }, '');
  };

  // Grid lines for accuracy reference
  const gridLines = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map(accuracy => {
    const y = height - 40 - ((accuracy / 100) * (height - 60)) + 20;
    return (
      <g key={accuracy}>
        <line
          x1={20}
          y1={y}
          x2={width - 20}
          y2={y}
          stroke={accuracy % 20 === 0 ? '#374151' : '#1f2937'}
          strokeWidth={accuracy % 20 === 0 ? 1 : 0.5}
          strokeDasharray={accuracy % 20 === 0 ? 'none' : '2,2'}
        />
        <text
          x={10}
          y={y + 4}
          fontSize="10"
          fill="#9ca3af"
          textAnchor="middle"
        >
          {accuracy}
        </text>
      </g>
    );
  });

  return (
    <div className={`accuracy-graph ${className || ''}`}>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Accuracy Over Time</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-400"></div>
              <span className="text-gray-300">White</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-400"></div>
              <span className="text-gray-300">Black</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <svg width={width} height={height} className="bg-gray-900 rounded">
            {/* Grid lines */}
            {gridLines}
            
            {/* Vertical center line */}
            <line
              x1={width / 2}
              y1={20}
              x2={width / 2}
              y2={height - 20}
              stroke="#374151"
              strokeWidth={1}
              strokeDasharray="4,4"
            />

            {/* White accuracy line */}
            {data.whitePoints.length > 1 && (
              <path
                d={createPath(data.whitePoints)}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={2}
                opacity={0.8}
              />
            )}

            {/* Black accuracy line */}
            {data.blackPoints.length > 1 && (
              <path
                d={createPath(data.blackPoints)}
                fill="none"
                stroke="#f87171"
                strokeWidth={2}
                opacity={0.8}
              />
            )}

            {/* White accuracy points */}
            {data.whitePoints.map((point, index) => (
              <g key={`white-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={getClassificationColor(point.classification)}
                  stroke="#60a5fa"
                  strokeWidth={2}
                />
                {point.classification === 'blunder' && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={8}
                    fill="none"
                    stroke="#e74c3c"
                    strokeWidth={2}
                    opacity={0.6}
                  />
                )}
              </g>
            ))}

            {/* Black accuracy points */}
            {data.blackPoints.map((point, index) => (
              <g key={`black-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={getClassificationColor(point.classification)}
                  stroke="#f87171"
                  strokeWidth={2}
                />
                {point.classification === 'blunder' && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={8}
                    fill="none"
                    stroke="#e74c3c"
                    strokeWidth={2}
                    opacity={0.6}
                  />
                )}
              </g>
            ))}

            {/* Axes */}
            <line
              x1={20}
              y1={height - 20}
              x2={width - 20}
              y2={height - 20}
              stroke="#4b5563"
              strokeWidth={1}
            />
            <line
              x1={20}
              y1={20}
              x2={20}
              y2={height - 20}
              stroke="#4b5563"
              strokeWidth={1}
            />

            {/* Labels */}
            <text
              x={width / 2}
              y={height - 5}
              fontSize="12"
              fill="#9ca3af"
              textAnchor="middle"
            >
              Move Number
            </text>
            <text
              x={5}
              y={height / 2}
              fontSize="12"
              fill="#9ca3af"
              textAnchor="middle"
              transform={`rotate(-90, 5, ${height / 2})`}
            >
              Accuracy %
            </text>
          </svg>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-400">Excellent</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-400">Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-gray-400">Inaccuracy</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-gray-400">Mistake</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-400">Blunder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
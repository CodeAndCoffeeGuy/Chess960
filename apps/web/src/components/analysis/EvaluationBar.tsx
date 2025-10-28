'use client';

import React from 'react';

interface EvaluationBarProps {
  evaluation: number;
  mate?: number;
  className?: string;
  showLabel?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  mate,
  className,
  showLabel = true,
  orientation = 'vertical'
}) => {
  // Convert evaluation to a percentage for the bar
  // Clamp evaluation between -5 and +5 for display purposes
  const clampedEval = Math.max(-5, Math.min(5, evaluation));
  const percentage = ((clampedEval + 5) / 10) * 100;

  const getEvaluationText = () => {
    if (mate !== undefined) {
      return mate > 0 ? `M${mate}` : `M${Math.abs(mate)}`;
    }
    
    if (Math.abs(evaluation) >= 10) {
      return evaluation > 0 ? '+10.0' : '-10.0';
    }
    
    return evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1);
  };

  const getEvaluationColor = () => {
    if (mate !== undefined) {
      return mate > 0 ? 'text-green-300' : 'text-red-300';
    }
    
    if (evaluation > 2) return 'text-green-400';
    if (evaluation > 1) return 'text-green-300';
    if (evaluation > -1) return 'text-gray-300';
    if (evaluation > -2) return 'text-red-300';
    return 'text-red-400';
  };

  if (orientation === 'horizontal') {
    return (
      <div className={`evaluation-bar-horizontal ${className || ''}`}>
        <div className="relative w-full h-8 bg-gray-800 rounded overflow-hidden">
          {/* Black side */}
          <div 
            className="absolute left-0 top-0 h-full bg-gray-900 transition-all duration-300"
            style={{ width: `${100 - percentage}%` }}
          />
          
          {/* White side */}
          <div 
            className="absolute right-0 top-0 h-full bg-white transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
          
          {/* Center line */}
          <div className="absolute left-1/2 top-0 w-px h-full bg-gray-600 transform -translate-x-px" />
          
          {showLabel && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${getEvaluationColor()}`}>
                {getEvaluationText()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`evaluation-bar-vertical ${className || ''}`}>
      <div className="relative w-6 h-full bg-gray-900 rounded-sm overflow-hidden shadow-inner">
        {/* Black side (top) */}
        <div
          className="absolute top-0 left-0 w-full bg-[#2c2c2c] transition-all duration-200 ease-out"
          style={{ height: `${100 - percentage}%` }}
        />

        {/* White side (bottom) */}
        <div
          className="absolute bottom-0 left-0 w-full bg-[#f0f0f0] transition-all duration-200 ease-out"
          style={{ height: `${percentage}%` }}
        />

        {/* Center line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 transform -translate-y-px" />
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <span className={`text-xs font-mono font-bold ${getEvaluationColor()}`}>
            {getEvaluationText()}
          </span>
        </div>
      )}
    </div>
  );
};
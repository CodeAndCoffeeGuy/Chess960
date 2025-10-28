'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RatingPoint {
  gameId: string;
  rating: number;
  timestamp: string;
}

interface RatingGraphProps {
  username: string;
  tc: string;
}

export function RatingGraph({ username, tc }: RatingGraphProps) {
  const [history, setHistory] = useState<RatingPoint[]>([]);
  const [current, setCurrent] = useState<{ rating: number; rd: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatingHistory();
  }, [username, tc]);

  const loadRatingHistory = async () => {
    try {
      // Always use 'bullet' for unified rating system
      const response = await fetch(`/api/user/rating-history/${username}?tc=bullet`);
      if (!response.ok) throw new Error('Failed to load rating history');

      const data = await response.json();
      setHistory(data.history || []);
      setCurrent(data.current);
    } catch (error) {
      console.error('Error loading rating history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 opacity-0"></div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-8 text-center">
        <TrendingUp className="w-12 h-12 text-[#a0958a] mx-auto mb-3" />
        <h3 className="text-white light:text-black font-semibold text-lg mb-2">No rating history yet</h3>
        <p className="text-[#a0958a] light:text-[#5a5449] text-sm">Play more games to see your rating progression</p>
      </div>
    );
  }

  // Calculate stats
  const firstRating = history[0].rating;
  const lastRating = history[history.length - 1].rating;
  const change = lastRating - firstRating;
  const changePercent = ((change / firstRating) * 100).toFixed(1);

  const maxRating = Math.max(...history.map(p => p.rating));
  const minRating = Math.min(...history.map(p => p.rating));
  const peak = Math.max(maxRating, current?.rating || 0);
  const lowest = Math.min(minRating, current?.rating || 99999);

  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const scaleX = (index: number) => {
    return (index / (history.length - 1)) * chartWidth + padding.left;
  };

  const yRange = peak - lowest || 100;
  const yMin = lowest - yRange * 0.1; // Add 10% padding
  const yMax = peak + yRange * 0.1;

  const scaleY = (rating: number) => {
    return height - padding.bottom - ((rating - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Generate path
  const linePath = history.map((point, index) => {
    const x = scaleX(index);
    const y = scaleY(point.rating);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area fill path
  const areaPath = `${linePath} L ${scaleX(history.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Y-axis ticks
  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const value = yMin + (yMax - yMin) * (i / (tickCount - 1));
    return Math.round(value);
  });

  return (
    <div className="bg-[#2a2723] light:bg-[#f5f1ea] border border-[#474239] light:border-[#d4caba] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white light:text-black font-semibold text-lg">Rating Progression</h3>
          <p className="text-[#a0958a] light:text-[#5a5449] text-sm mt-1">{history.length} games</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold flex items-center space-x-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            <span>{change >= 0 ? '+' : ''}{change}</span>
          </div>
          <div className="text-sm text-[#a0958a] light:text-[#5a5449] mt-1">
            {changePercent >= '0' ? '+' : ''}{changePercent}% change
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#35322e] light:bg-[#f5f1ea] rounded-lg p-3">
          <div className="text-xs text-[#a0958a] light:text-[#5a5449]">Current</div>
          <div className="text-xl font-bold text-white light:text-black">{Math.round(current?.rating || lastRating)}</div>
        </div>
        <div className="bg-[#35322e] light:bg-[#f5f1ea] rounded-lg p-3">
          <div className="text-xs text-[#a0958a] light:text-[#5a5449]">Peak</div>
          <div className="text-xl font-bold text-orange-400">{Math.round(peak)}</div>
        </div>
        <div className="bg-[#35322e] light:bg-[#f5f1ea] rounded-lg p-3">
          <div className="text-xs text-[#a0958a] light:text-[#5a5449]">Lowest</div>
          <div className="text-xl font-bold text-gray-400">{Math.round(lowest)}</div>
        </div>
      </div>

      {/* Graph */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minHeight: '300px' }}
        >
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={padding.left}
              y1={scaleY(tick)}
              x2={width - padding.right}
              y2={scaleY(tick)}
              stroke="#3a3632"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.2"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#fb923c"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {history.map((point, index) => (
            <circle
              key={point.gameId}
              cx={scaleX(index)}
              cy={scaleY(point.rating)}
              r="4"
              fill="#fb923c"
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>{`Rating: ${Math.round(point.rating)}`}</title>
            </circle>
          ))}

          {/* Y-axis labels */}
          {yTicks.map((tick) => (
            <text
              key={tick}
              x={padding.left - 10}
              y={scaleY(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#a0958a"
              fontSize="12"
            >
              {Math.round(tick)}
            </text>
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

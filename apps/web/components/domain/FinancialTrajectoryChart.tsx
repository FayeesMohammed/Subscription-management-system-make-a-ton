'use client';

import React, { useState } from 'react';
import { formatMoney } from '@/lib/formatters';

export interface TrajectoryDataPoint {
  month: string;
  mrr: number;
  collections: number;
}

interface FinancialTrajectoryChartProps {
  data?: TrajectoryDataPoint[];
  title?: string;
}

const DEFAULT_DATA: TrajectoryDataPoint[] = [
  { month: 'May 26', mrr: 4500, collections: 4200 },
  { month: 'Jun 26', mrr: 6800, collections: 6100 },
  { month: 'Jul 26', mrr: 8200, collections: 7900 },
  { month: 'Aug 26', mrr: 10400, collections: 9800 },
  { month: 'Sep 26', mrr: 11900, collections: 11200 },
  { month: 'Oct 26', mrr: 12500, collections: 13440 },
];

export const FinancialTrajectoryChart: React.FC<FinancialTrajectoryChartProps> = ({
  data = DEFAULT_DATA,
  title = 'Financial Velocity & Cash Realization',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => Math.max(d.mrr, d.collections))) * 1.25 || 16000;
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getCoordinates = (index: number, value: number) => {
    const x = paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - (value / maxVal) * (height - 2 * paddingY);
    return { x, y };
  };

  const mrrPoints = data.map((d, i) => getCoordinates(i, d.mrr));
  const colPoints = data.map((d, i) => getCoordinates(i, d.collections));

  const makePath = (points: { x: number; y: number }[]) => {
    return points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      return `${acc} L ${p.x} ${p.y}`;
    }, '');
  };

  const makeAreaPath = (points: { x: number; y: number }[]) => {
    const linePath = makePath(points);
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${height - paddingY} L ${first.x} ${height - paddingY} Z`;
  };

  const activeData = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  return (
    <div className="rounded-xl border border-[#1f283d] bg-[#0c1017] p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2333] pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
            {title}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-bold text-white font-mono">
              {activeData.month}:
            </span>
            <span className="text-xs font-mono font-bold text-[#fcee21] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#fcee21]" />
              MRR: {formatMoney(activeData.mrr)}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Realized: {formatMoney(activeData.collections)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-[#fcee21] rounded-full" />
            Recurring Run-Rate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 bg-emerald-400 rounded-full" />
            Cash Inflow
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fcee21" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#fcee21" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - 2 * paddingY);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#1b2333"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            );
          })}

          {/* Area fills */}
          <path d={makeAreaPath(mrrPoints)} fill="url(#yellowGradient)" />
          <path d={makeAreaPath(colPoints)} fill="url(#emeraldGradient)" />

          {/* Stroke Lines */}
          <path
            d={makePath(mrrPoints)}
            fill="none"
            stroke="#fcee21"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={makePath(colPoints)}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const mrrPt = getCoordinates(i, d.mrr);
            const colPt = getCoordinates(i, d.collections);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Hit area */}
                <rect
                  x={mrrPt.x - 20}
                  y={0}
                  width="40"
                  height={height}
                  fill="transparent"
                />

                {isHovered && (
                  <line
                    x1={mrrPt.x}
                    y1={paddingY}
                    x2={mrrPt.x}
                    y2={height - paddingY}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                <circle
                  cx={mrrPt.x}
                  cy={mrrPt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#08090d"
                  stroke="#fcee21"
                  strokeWidth="2.5"
                  className="transition-all"
                />
                <circle
                  cx={colPt.x}
                  cy={colPt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#08090d"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="transition-all"
                />

                {/* X Axis Month Labels */}
                <text
                  x={mrrPt.x}
                  y={height - 6}
                  textAnchor="middle"
                  fill={isHovered ? '#fcee21' : '#64748b'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

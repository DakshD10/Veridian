"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";

export interface TrendDataPoint {
  run: string;
  score: number;
}

const CustomizedDot = (props: { cx?: number; cy?: number; value?: number }) => {
  const { cx, cy, value } = props;
  if (value !== undefined && value < 0.75) {
    return (
      <circle cx={cx} cy={cy} r={4} fill="#EF4444" stroke="none" />
    );
  }
  return null;
};

export function QualityTrendChart({ data }: { data: TrendDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[280px] bg-[#121215] border border-[#1F1F23] rounded-lg p-6 flex flex-col items-center justify-center">
        <span className="text-[#52525B] font-sans">No data available</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#121215] border border-[#1F1F23] rounded-lg p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="font-sans font-semibold text-sm text-[#FAFAFA]">Quality Trend</h3>
        <span className="font-sans text-xs text-[#71717A]">Medical Triage Suite · Last 30 days</span>
      </div>
      <div className="h-[200px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
            {/* Subtle horizontal rules at 0.25/0.5/0.75/1.0 */}
            <CartesianGrid vertical={false} stroke="#1F1F23" />
            
            <XAxis 
              dataKey="run" 
              tick={{ fill: '#52525B', fontSize: 11, fontFamily: 'monospace' }} 
              axisLine={false} 
              tickLine={false} 
              dy={10} 
            />
            <YAxis 
              domain={[0, 1]} 
              ticks={[0, 0.25, 0.5, 0.75, 1.0]} 
              tick={{ fill: '#52525B', fontSize: 11, fontFamily: 'monospace' }} 
              axisLine={false} 
              tickLine={false} 
              dx={-10} 
            />
            
            <ReferenceLine 
              y={0.75} 
              stroke="#F59E0B" 
              strokeDasharray="4 4" 
              label={{ position: 'right', value: 'Threshold 0.75', fill: '#F59E0B', fontSize: 11, fontFamily: 'sans-serif' }} 
            />
            
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#8B5CF6" 
              strokeWidth={2} 
              dot={<CustomizedDot />} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

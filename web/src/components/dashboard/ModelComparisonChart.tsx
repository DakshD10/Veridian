"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";

export interface ModelDataPoint {
  modelId: string;
  score: number;
  fill: string;
}

const renderCustomAxisTick = ({ y, payload }: { y?: number; payload?: { value: string } }) => {
  return (
    <g transform={`translate(0,${y})`}>
      <text x={0} y={0} dy={4} textAnchor="start" fill="#A1A1AA" fontSize={12} className="font-mono">
        {payload?.value}
      </text>
    </g>
  );
};

const renderCustomBarLabel = (props: { x?: number; y?: number; width?: number; height?: number; value?: number | string }) => {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  // Position outside the bar on the right
  return (
    <text x={x + width + 10} y={y + height / 2 + 5} fill="#FAFAFA" fontSize={14} fontWeight={700} className="font-mono" textAnchor="start">
      {value}
    </text>
  );
};

export function ModelComparisonChart({ data }: { data: ModelDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[280px] bg-[#111113] border border-[#1F1F23] rounded-lg p-6 flex flex-col items-center justify-center">
        <span className="text-[#52525B] font-sans">No data available</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#111113] border border-[#1F1F23] rounded-lg p-6 flex flex-col gap-6">
      <h3 className="font-sans font-semibold text-sm text-[#FAFAFA]">Model Comparison</h3>
      <div className="h-[200px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barSize={32}>
            <XAxis type="number" hide domain={[0, 1]} />
            <YAxis dataKey="modelId" type="category" axisLine={false} tickLine={false} width={150} tick={renderCustomAxisTick} />
            <Bar dataKey="score" radius={[4, 4, 4, 4]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="score" content={renderCustomBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

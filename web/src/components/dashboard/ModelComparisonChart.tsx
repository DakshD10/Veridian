"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";

export interface ModelDataPoint {
  modelId: string;
  score: number;
  fill: string;
}

interface CustomAxisTickProps {
  y?: string | number;
  payload?: {
    value?: string | number;
  };
}

interface CustomBarLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  value?: string | number | boolean | null;
  fill?: string;
}

const renderCustomAxisTick = ({ y = 0, payload }: CustomAxisTickProps) => {
  const yPosition = typeof y === "number" ? y : Number(y) || 0;

  return (
    <g transform={`translate(0,${yPosition})`}>
      <text x={0} y={0} dy={4} textAnchor="start" fill="#71717A" fontSize={11} className="font-mono">
        {payload?.value}
      </text>
    </g>
  );
};

const renderCustomBarLabel = ({ x = 0, y = 0, width = 0, height = 0, value, fill }: CustomBarLabelProps) => {
  const xPosition = typeof x === "number" ? x : Number(x) || 0;
  const yPosition = typeof y === "number" ? y : Number(y) || 0;
  const barWidth = typeof width === "number" ? width : Number(width) || 0;
  const barHeight = typeof height === "number" ? height : Number(height) || 0;

  // Position outside the bar on the right
  return (
    <text x={xPosition + barWidth + 10} y={yPosition + barHeight / 2 + 5} fill={fill || "#FAFAFA"} fontSize={12} fontWeight={700} className="font-mono" textAnchor="start">
      {value}
    </text>
  );
};

export function ModelComparisonChart({ data }: { data: ModelDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[280px] bg-[#121215] border border-[#1F1F23] rounded-lg p-6 flex flex-col items-center justify-center">
        <span className="text-[#52525B] font-sans">No data available</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#121215] border border-[#1F1F23] rounded-lg p-6 flex flex-col gap-6">
      <h3 className="font-sans font-semibold text-sm text-[#FAFAFA]">Model Comparison</h3>
      <div className="h-[200px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 120, bottom: 10 }} barSize={32}>
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

"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface EmploymentChartProps {
  data: { type: string; count: number }[];
}

const COLORS = [
  "hsl(160, 60%, 45%)",
  "hsl(35, 90%, 55%)",
  "hsl(270, 50%, 55%)",
  "hsl(0, 70%, 55%)",
];

const chartConfig: ChartConfig = {
  "Full-time": { label: "Full-time", color: "hsl(160, 60%, 45%)" },
  "Part-time": { label: "Part-time", color: "hsl(35, 90%, 55%)" },
  Contract: { label: "Contract", color: "hsl(270, 50%, 55%)" },
  Internship: { label: "Internship", color: "hsl(0, 70%, 55%)" },
};

export function EmploymentChart({ data }: EmploymentChartProps) {
  const total = data.reduce((a, b) => a + b.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Employment Type</CardTitle>
        <CardDescription className="text-xs">
          Distribution of employment types
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.type}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => {
                    const pct = ((Number(value) / total) * 100).toFixed(1);
                    return `${value?.toLocaleString()} (${pct}%)`;
                  }}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-4 mt-2">
          {data.map((d, i) => (
            <div key={d.type} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-muted-foreground">
                {d.type}{" "}
                <span className="font-medium text-foreground">
                  {((d.count / total) * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

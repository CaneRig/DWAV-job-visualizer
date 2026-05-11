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

interface RemoteChartProps {
  data: { type: string; count: number }[];
}

const COLORS: Record<string, string> = {
  Remote: "hsl(160, 60%, 45%)",
  "On-site": "hsl(35, 90%, 55%)",
  Hybrid: "hsl(270, 50%, 55%)",
};

const chartConfig: ChartConfig = {
  Remote: { label: "Remote", color: "hsl(160, 60%, 45%)" },
  "On-site": { label: "On-site", color: "hsl(35, 90%, 55%)" },
  Hybrid: { label: "Hybrid", color: "hsl(270, 50%, 55%)" },
};

export function RemoteChart({ data }: RemoteChartProps) {
  const total = data.reduce((a, b) => a + b.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Work Arrangement</CardTitle>
        <CardDescription className="text-xs">
          Remote, on-site, and hybrid distribution
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
              {data.map((entry) => (
                <Cell
                  key={entry.type}
                  fill={COLORS[entry.type] || "hsl(0,0%,50%)"}
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
          {data.map((d) => (
            <div key={d.type} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: COLORS[d.type] }}
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

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SkillsChartProps {
  data: { skill: string; count: number; data_science: number; it: number }[];
}

const chartConfig: ChartConfig = {
  data_science: {
    label: "Data Science",
    color: "hsl(160, 60%, 45%)",
  },
  it: {
    label: "IT",
    color: "hsl(35, 90%, 55%)",
  },
};

export function SkillsChart({ data }: SkillsChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Skills</CardTitle>
        <CardDescription className="text-xs">
          Most in-demand skills across all postings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis
              type="category"
              dataKey="skill"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={75}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="data_science"
              stackId="a"
              fill="var(--color-data_science)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="it"
              stackId="a"
              fill="var(--color-it)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

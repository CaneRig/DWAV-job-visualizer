"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SalaryDistChartProps {
  data: { range: string; count: number; data_science: number; it: number }[];
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

export function SalaryDistChart({ data }: SalaryDistChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Salary Distribution</CardTitle>
        <CardDescription className="text-xs">
          Monthly salary ranges in RUB (thousands)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="range"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(v) => v.replace("k", "K")}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
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
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

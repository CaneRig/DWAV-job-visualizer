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

interface SalaryExperienceChartProps {
  data: { level: string; count: number; avg_salary: number }[];
}

const chartConfig: ChartConfig = {
  avg_salary: {
    label: "Average Salary (K ₽)",
    color: "hsl(160, 60%, 45%)",
  },
  count: {
    label: "Postings",
    color: "hsl(35, 90%, 55%)",
  },
};

export function SalaryExperienceChart({ data }: SalaryExperienceChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    salary_k: Math.round(d.avg_salary / 1000),
    level: d.level,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Salary by Experience</CardTitle>
        <CardDescription className="text-xs">
          Average salary and posting count per experience level
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="level" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(v) => `${v}K`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "salary_k") return `${value}K ₽`;
                    return String(value);
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              yAxisId="left"
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="salary_k"
              fill="var(--color-avg_salary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

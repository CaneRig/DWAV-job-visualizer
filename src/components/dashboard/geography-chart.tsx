"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface GeographyChartProps {
  data: { region: string; count: number; avg_salary: number }[];
}

const chartConfig: ChartConfig = {
  count: {
    label: "Postings",
    color: "hsl(160, 60%, 45%)",
  },
  avg_salary: {
    label: "Avg Salary (K ₽)",
    color: "hsl(35, 90%, 55%)",
  },
};

export function GeographyChart({ data }: GeographyChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    avg_salary_k: Math.round(d.avg_salary / 1000),
    shortRegion:
      d.region.length > 12 ? d.region.substring(0, 11) + "…" : d.region,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Geographic Distribution</CardTitle>
        <CardDescription className="text-xs">
          Job postings by region with average salary
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={formattedData}
            margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="shortRegion"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              angle={-35}
              textAnchor="end"
              height={60}
            />
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
                    if (name === "avg_salary_k")
                      return `${value}K ₽`;
                    return value?.toLocaleString();
                  }}
                />
              }
            />
            <Bar
              yAxisId="left"
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="avg_salary_k"
              fill="var(--color-avg_salary)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

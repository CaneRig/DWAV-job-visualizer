"use client";

import { useMemo } from "react";
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

interface CompanySalaryChartProps {
  data: { company: string; count: number; avg_salary: number }[];
}

const chartConfig: ChartConfig = {
  avg_salary: {
    label: "Avg Salary (K ₽)",
    color: "hsl(160, 60%, 45%)",
  },
  postings: {
    label: "Postings",
    color: "hsl(35, 90%, 55%)",
  },
};

export function CompanySalaryChart({ data }: CompanySalaryChartProps) {
  const formatted = data.slice(0, 15).map((d) => ({
    ...d,
    avg_k: Math.round(d.avg_salary / 1000),
    company:
      d.company.length > 15 ? d.company.substring(0, 14) + "…" : d.company,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Company Salary Overview</CardTitle>
        <CardDescription className="text-xs">
          Average salary and posting volume for top companies
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            data={formatted}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 75, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(v) => `${v}K`}
            />
            <YAxis
              type="category"
              dataKey="company"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={70}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const p = item.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{p.company}</div>
                        <div>Avg salary: {p.avg_k}K ₽</div>
                        <div>{p.count} postings</div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar
              dataKey="avg_k"
              fill="var(--color-avg_salary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

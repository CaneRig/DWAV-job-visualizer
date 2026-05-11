"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ExperienceChartProps {
  data: { level: string; count: number; avg_salary: number }[];
}

const COLORS = [
  "hsl(160, 60%, 65%)",
  "hsl(160, 60%, 50%)",
  "hsl(160, 60%, 40%)",
  "hsl(160, 60%, 28%)",
];

const chartConfig: ChartConfig = {
  count: {
    label: "Postings",
    color: "hsl(160, 60%, 45%)",
  },
  avg_salary: {
    label: "Avg Salary (₽)",
    color: "hsl(35, 90%, 55%)",
  },
};

export function ExperienceChart({ data }: ExperienceChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Experience Level</CardTitle>
        <CardDescription className="text-xs">
          Distribution by experience with average salary
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="level"
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "avg_salary")
                      return `${Number(value).toLocaleString("ru-RU")} ₽`;
                    return value?.toLocaleString();
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        {/* Salary by experience */}
        <div className="mt-4 space-y-2">
          {data.map((d, i) => (
            <div key={d.level} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-muted-foreground">{d.level}</span>
              </div>
              <span className="font-medium">
                {d.avg_salary.toLocaleString("ru-RU")} ₽
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

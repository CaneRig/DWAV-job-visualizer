"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SalaryByCategoryChartProps {
  data: {
    category: string;
    subcategory: string;
    min: number;
    max: number;
    avg: number;
    median: number;
    count: number;
  }[];
}

const chartConfig: ChartConfig = {
  avg: {
    label: "Average Salary (K ₽)",
    color: "hsl(160, 60%, 45%)",
  },
};

export function SalaryByCategoryChart({ data }: SalaryByCategoryChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    avg_k: Math.round(d.avg / 1000),
    median_k: Math.round(d.median / 1000),
    min_k: Math.round(d.min / 1000),
    max_k: Math.round(d.max / 1000),
    range_k: Math.round((d.max - d.min) / 1000),
    shortSub:
      d.subcategory.length > 18
        ? d.subcategory.substring(0, 17) + "…"
        : d.subcategory,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Salary by Role</CardTitle>
        <CardDescription className="text-xs">
          Average salary comparison across roles (thousands ₽)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 95, bottom: 5 }}
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
              dataKey="shortSub"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={90}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const p = item.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{p.subcategory}</div>
                        <div>Avg: {p.avg.toLocaleString("ru-RU")} ₽</div>
                        <div>Median: {p.median.toLocaleString("ru-RU")} ₽</div>
                        <div>
                          Range: {p.min_k}K – {p.max_k}K ₽
                        </div>
                        <div className="text-muted-foreground">
                          {p.count} postings
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar
              dataKey="avg_k"
              fill="var(--color-avg)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

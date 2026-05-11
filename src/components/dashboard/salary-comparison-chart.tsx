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

interface SalaryComparisonChartProps {
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
  avg_ds: {
    label: "DS Avg (K ₽)",
    color: "hsl(160, 60%, 45%)",
  },
  avg_it: {
    label: "IT Avg (K ₽)",
    color: "hsl(35, 90%, 55%)",
  },
};

export function SalaryComparisonChart({ data }: SalaryComparisonChartProps) {
  // Group by subcategory and create DS vs IT comparison
  // Find top subcategories and show their salary ranges
  const topRoles = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const formatted = topRoles.map((d) => ({
    role: d.subcategory,
    category: d.category,
    avg_k: Math.round(d.avg / 1000),
    median_k: Math.round(d.median / 1000),
    min_k: Math.round(d.min / 1000),
    max_k: Math.round(d.max / 1000),
    range_k: Math.round((d.max - d.min) / 1000),
    count: d.count,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Salary Range by Role</CardTitle>
        <CardDescription className="text-xs">
          Min, median, average, and max salary per role (K ₽)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[420px] w-full">
          <BarChart
            data={formatted}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 105, bottom: 5 }}
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
              dataKey="role"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={100}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const p = item.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{p.role} ({p.category})</div>
                        <div>Min: {p.min_k}K • Median: {p.median_k}K</div>
                        <div>Avg: {p.avg_k}K • Max: {p.max_k}K</div>
                        <div className="text-muted-foreground">{p.count} postings</div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="min_k" fill="hsl(0, 0%, 80%)" radius={[3, 3, 0, 0]} name="Min" />
            <Bar dataKey="median_k" fill="hsl(160, 60%, 60%)" radius={[0, 0, 0, 0]} name="Median" />
            <Bar dataKey="avg_k" fill="hsl(160, 60%, 45%)" radius={[0, 0, 0, 0]} name="Avg" />
            <Bar dataKey="max_k" fill="hsl(35, 90%, 55%)" radius={[0, 3, 3, 0]} name="Max" />
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(0, 0%, 80%)" }} /> Min
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(160, 60%, 60%)" }} /> Median
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(160, 60%, 45%)" }} /> Avg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(35, 90%, 55%)" }} /> Max
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

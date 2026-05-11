"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

interface TimelineChartProps {
  data: { date: string; count: number; data_science: number; it: number }[];
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

export function TimelineChart({ data }: TimelineChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    shortDate: d.date.substring(5), // MM-DD format
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Postings Timeline</CardTitle>
        <CardDescription className="text-xs">
          Daily job posting volume over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={formattedData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="fillDS" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-data_science)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-data_science)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillIT" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-it)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-it)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="shortDate"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              interval={2}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="it"
              stroke="var(--color-it)"
              fill="url(#fillIT)"
              strokeWidth={2}
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="data_science"
              stroke="var(--color-data_science)"
              fill="url(#fillDS)"
              strokeWidth={2}
              stackId="1"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

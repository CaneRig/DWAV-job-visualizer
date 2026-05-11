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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SkillCorrelationChartProps {
  data: {
    skill: string;
    data_science_count: number;
    it_count: number;
  }[];
}

const chartConfig: ChartConfig = {
  data_science_count: {
    label: "Data Science",
    color: "hsl(160, 60%, 45%)",
  },
  it_count: {
    label: "IT",
    color: "hsl(35, 90%, 55%)",
  },
};

export function SkillCorrelationChart({ data }: SkillCorrelationChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Skills: DS vs IT</CardTitle>
        <CardDescription className="text-xs">
          Skill demand comparison between Data Science and IT roles
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 75, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis
              type="category"
              dataKey="skill"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={70}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="data_science_count"
              fill="var(--color-data_science_count)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="it_count"
              fill="var(--color-it_count)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

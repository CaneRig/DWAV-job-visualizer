"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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

interface SkillsRadarChartProps {
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

export function SkillsRadarChart({ data }: SkillsRadarChartProps) {
  const top15 = data.slice(0, 15).map((d) => ({
    skill: d.skill,
    data_science_count: d.data_science_count,
    it_count: d.it_count,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Skills Radar: DS vs IT</CardTitle>
        <CardDescription className="text-xs">
          Comparing top 15 skill demand patterns between categories
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[420px] w-full">
          <RadarChart data={top15} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" fontSize={9} tickLine={false} />
            <PolarRadiusAxis fontSize={9} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Radar
              name="Data Science"
              dataKey="data_science_count"
              stroke="var(--color-data_science_count)"
              fill="var(--color-data_science_count)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Radar
              name="IT"
              dataKey="it_count"
              stroke="var(--color-it_count)"
              fill="var(--color-it_count)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

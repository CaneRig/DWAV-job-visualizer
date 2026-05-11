"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SkillsBubbleChartProps {
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

function getBubbleColor(ds: number, it: number): string {
  const total = ds + it;
  if (total === 0) return "hsl(0, 0%, 60%)";
  const dsRatio = ds / total;
  if (dsRatio > 0.7) return "hsl(160, 60%, 45%)";
  if (dsRatio > 0.4) return "hsl(90, 50%, 50%)";
  return "hsl(35, 90%, 55%)";
}

export function SkillsBubbleChart({ data }: SkillsBubbleChartProps) {
  const formatted = data
    .filter((d) => d.data_science_count > 0 || d.it_count > 0)
    .map((d) => ({
      ...d,
      total: d.data_science_count + d.it_count,
      dsRatio: Math.round((d.data_science_count / (d.data_science_count + d.it_count)) * 100),
    }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Skills Landscape</CardTitle>
        <CardDescription className="text-xs">
          Bubble position shows DS vs IT demand. Size = total mentions. Green = DS-dominant, Amber = IT-dominant
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[420px] w-full">
          <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="data_science_count"
              name="Data Science"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              label={{ value: "Data Science demand", position: "insideBottom", offset: -5, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="it_count"
              name="IT"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              label={{ value: "IT demand", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="total" range={[80, 800]} name="Total" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const p = item.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{p.skill}</div>
                        <div>DS: {p.data_science_count} • IT: {p.it_count}</div>
                        <div>Total: {p.total} • DS ratio: {p.dsRatio}%</div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Scatter data={formatted} name="Skills">
              {formatted.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBubbleColor(entry.data_science_count, entry.it_count)}
                  fillOpacity={0.7}
                  stroke={getBubbleColor(entry.data_science_count, entry.it_count)}
                  strokeWidth={1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

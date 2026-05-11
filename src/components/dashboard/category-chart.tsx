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
import { Badge } from "@/components/ui/badge";

interface CategoryChartProps {
  data: {
    category: string;
    subcategory: string;
    count: number;
    avg_salary: number;
  }[];
}

const DS_COLOR = "hsl(160, 60%, 45%)";
const IT_COLOR = "hsl(35, 90%, 55%)";

const chartConfig: ChartConfig = {
  count: {
    label: "Postings",
    color: "hsl(160, 60%, 45%)",
  },
};

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Category Breakdown</CardTitle>
        <CardDescription className="text-xs">
          Job postings by subcategory
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis
              type="category"
              dataKey="subcategory"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={95}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const payload = item.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-medium">{payload.subcategory}</div>
                        <div>
                          {payload.count} postings • Avg:{" "}
                          {payload.avg_salary.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.subcategory}
                  fill={
                    entry.category === "Data Science" ? DS_COLOR : IT_COLOR
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="flex items-center gap-3 mt-2">
          <Badge
            variant="outline"
            className="gap-1 text-xs"
            style={{ borderColor: DS_COLOR, color: DS_COLOR }}
          >
            <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: DS_COLOR }} />
            Data Science
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 text-xs"
            style={{ borderColor: IT_COLOR, color: IT_COLOR }}
          >
            <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: IT_COLOR }} />
            IT
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

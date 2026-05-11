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
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CompaniesChartProps {
  data: { company: string; count: number; avg_salary: number }[];
}

const chartConfig: ChartConfig = {
  count: {
    label: "Postings",
    color: "hsl(160, 60%, 45%)",
  },
};

export function CompaniesChart({ data }: CompaniesChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Companies</CardTitle>
        <CardDescription className="text-xs">
          Companies with most job postings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis
              type="category"
              dataKey="company"
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={75}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => {
                    const payload = item.payload;
                    return (
                      <div>
                        <div className="font-medium">{payload.company}</div>
                        <div>{payload.count} postings</div>
                        <div>
                          Avg: {payload.avg_salary.toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

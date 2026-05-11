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
import { Badge } from "@/components/ui/badge";

interface CategorySkillsChartProps {
  data: {
    category: string;
    subcategory: string;
    count: number;
    avg_salary: number;
  }[];
  jobs: {
    category: string;
    subcategory: string;
    skills: string[];
  }[];
}

const chartConfig: ChartConfig = {
  count: {
    label: "Skill Mentions",
    color: "hsl(160, 60%, 45%)",
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Data Science": "hsl(160, 60%, 45%)",
  IT: "hsl(35, 90%, 55%)",
};

export function CategorySkillsChart({ data, jobs }: CategorySkillsChartProps) {
  // Compute top skills per top 6 subcategories
  const topSubcategories = useMemo(() => {
    return data.slice(0, 6).map((cat) => {
      const skillCounts: Record<string, number> = {};
      jobs
        .filter((j) => j.subcategory === cat.subcategory)
        .forEach((j) => {
          j.skills.forEach((s) => {
            skillCounts[s] = (skillCounts[s] || 0) + 1;
          });
        });

      const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([skill, count]) => ({ skill, count }));

      return {
        subcategory: cat.subcategory,
        category: cat.category,
        topSkills,
      };
    });
  }, [data, jobs]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Top Skills by Role</CardTitle>
        <CardDescription className="text-xs">
          Most demanded skills broken down by top subcategories
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topSubcategories.map((sub) => (
            <div key={sub.subcategory} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                  style={{
                    backgroundColor:
                      sub.category === "Data Science"
                        ? "hsl(160, 60%, 90%)"
                        : "hsl(35, 90%, 90%)",
                    color:
                      sub.category === "Data Science"
                        ? "hsl(160, 60%, 30%)"
                        : "hsl(35, 90%, 30%)",
                  }}
                >
                  {sub.subcategory}
                </Badge>
              </div>
              <ChartContainer config={chartConfig} className="h-[180px] w-full">
                <BarChart
                  data={sub.topSkills}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 55, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                    width={50}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill={CATEGORY_COLORS[sub.category] || "hsl(0,0%,50%)"}
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

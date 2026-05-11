"use client";

import {
  Briefcase,
  TrendingUp,
  MapPin,
  MonitorSmartphone,
  Cpu,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPIData {
  total_jobs: number;
  avg_salary_rub: number;
  median_salary_rub: number;
  top_category: string;
  remote_percentage: number;
  top_skill: string;
  top_location: string;
}

function formatSalary(value: number): string {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }
  return value.toLocaleString();
}

function formatSalaryFull(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

const kpis = [
  {
    key: "total_jobs" as const,
    label: "Total Postings",
    icon: Briefcase,
    format: (v: number) => v.toLocaleString(),
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  {
    key: "avg_salary_rub" as const,
    label: "Average Salary",
    icon: TrendingUp,
    format: formatSalaryFull,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
  },
  {
    key: "median_salary_rub" as const,
    label: "Median Salary",
    icon: BarChart3,
    format: formatSalaryFull,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/50",
  },
  {
    key: "remote_percentage" as const,
    label: "Remote %",
    icon: MonitorSmartphone,
    format: (v: number) => `${v}%`,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
  },
  {
    key: "top_skill" as const,
    label: "Top Skill",
    icon: Cpu,
    format: (v: string | number) => String(v),
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
  },
  {
    key: "top_location" as const,
    label: "Top Location",
    icon: MapPin,
    format: (v: string | number) => String(v),
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/50",
  },
];

export function KPICards({ data }: { data: KPIData | null }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const value = data[kpi.key];
        const Icon = kpi.icon;
        return (
          <Card key={kpi.key} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md ${kpi.bg}`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </span>
              </div>
              <div className="text-lg font-bold tracking-tight truncate">
                {kpi.format(value as never)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

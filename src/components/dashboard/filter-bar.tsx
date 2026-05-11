"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import type { DashboardFilters, ExperienceLevel } from "@/lib/types";

interface FilterBarProps {
  filters: DashboardFilters;
  uniqueRegions: string[];
  onUpdate: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => void;
  onReset: () => void;
  resultCount: number;
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "No experience",
  "1-3 years",
  "3-6 years",
  "6+ years",
];

export function FilterBar({
  filters,
  uniqueRegions,
  onUpdate,
  onReset,
  resultCount,
}: FilterBarProps) {
  const hasFilters =
    filters.category !== "all" ||
    filters.region !== "all" ||
    filters.experience !== "all" ||
    filters.remote !== "all" ||
    filters.search !== "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <Select
          value={filters.category}
          onValueChange={(v) => onUpdate("category", v as DashboardFilters["category"])}
        >
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Data Science">Data Science</SelectItem>
            <SelectItem value="IT">IT</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.region}
          onValueChange={(v) => onUpdate("region", v)}
        >
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {uniqueRegions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.experience}
          onValueChange={(v) =>
            onUpdate("experience", v as DashboardFilters["experience"])
          }
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {EXPERIENCE_LEVELS.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.remote}
          onValueChange={(v) =>
            onUpdate("remote", v as DashboardFilters["remote"])
          }
        >
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Work Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
            <SelectItem value="On-site">On-site</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="Search jobs, companies, skills..."
            value={filters.search}
            onChange={(e) => onUpdate("search", e.target.value)}
            className="h-9 text-sm pr-8"
          />
          {filters.search && (
            <button
              onClick={() => onUpdate("search", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9 text-sm">
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {resultCount.toLocaleString()}
        </span>{" "}
        job postings
      </div>
    </div>
  );
}

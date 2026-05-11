"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import type { JobPosting } from "@/lib/types";

interface JobTableProps {
  jobs: JobPosting[];
}

const PAGE_SIZE = 20;

type SortField =
  | "title"
  | "company"
  | "salary"
  | "region"
  | "experience"
  | "work_type"
  | "published_at";
type SortDir = "asc" | "desc";

function getSalaryValue(job: JobPosting): number {
  const rates: Record<string, number> = { RUB: 1, USD: 90, EUR: 95 };
  const rate = rates[job.salary_currency] || 1;
  if (job.salary_from !== null && job.salary_to !== null)
    return ((job.salary_from + job.salary_to) / 2) * rate;
  if (job.salary_from !== null) return job.salary_from * rate;
  if (job.salary_to !== null) return job.salary_to * rate;
  return 0;
}

function formatSalary(job: JobPosting): string {
  if (job.salary_from === null && job.salary_to === null) return "—";
  const from = job.salary_from?.toLocaleString("ru-RU") || "";
  const to = job.salary_to?.toLocaleString("ru-RU") || "";
  const curr = job.salary_currency === "RUB" ? "₽" : job.salary_currency;
  if (from && to) return `${from}–${to} ${curr}`;
  if (from) return `from ${from} ${curr}`;
  return `up to ${to} ${curr}`;
}

function getExperienceColor(exp: string): string {
  switch (exp) {
    case "No experience":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "1-3 years":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300";
    case "3-6 years":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    case "6+ years":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
    default:
      return "";
  }
}

function getCategoryStyle(cat: string) {
  if (cat === "Data Science")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
}

const EXPERIENCE_ORDER: Record<string, number> = {
  "No experience": 0,
  "1-3 years": 1,
  "3-6 years": 2,
  "6+ years": 3,
};

function SortIconComponent({
  field,
  currentField,
  currentDir,
}: {
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
}) {
  if (currentField !== field)
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return currentDir === "asc" ? (
    <ArrowUp className="h-3 w-3 ml-1" />
  ) : (
    <ArrowDown className="h-3 w-3 ml-1" />
  );
}

export function JobTable({ jobs }: JobTableProps) {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("published_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Table-level filters
  const [tableSearch, setTableSearch] = useState("");
  const [tableCategory, setTableCategory] = useState<string>("all");
  const [tableExperience, setTableExperience] = useState<string>("all");
  const [tableWorkType, setTableWorkType] = useState<string>("all");

  const hasTableFilters =
    tableSearch !== "" ||
    tableCategory !== "all" ||
    tableExperience !== "all" ||
    tableWorkType !== "all";

  const resetTableFilters = () => {
    setTableSearch("");
    setTableCategory("all");
    setTableExperience("all");
    setTableWorkType("all");
  };

  // Filter + sort
  const processedJobs = useMemo(() => {
    let result = [...jobs];

    // Table-level filtering
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q)) ||
          j.subcategory.toLowerCase().includes(q)
      );
    }
    if (tableCategory !== "all") {
      result = result.filter((j) => j.category === tableCategory);
    }
    if (tableExperience !== "all") {
      result = result.filter((j) => j.experience === tableExperience);
    }
    if (tableWorkType !== "all") {
      result = result.filter((j) => j.work_type === tableWorkType);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "salary":
          cmp = getSalaryValue(a) - getSalaryValue(b);
          break;
        case "region":
          cmp = a.region.localeCompare(b.region);
          break;
        case "experience":
          cmp =
            (EXPERIENCE_ORDER[a.experience] ?? 0) -
            (EXPERIENCE_ORDER[b.experience] ?? 0);
          break;
        case "work_type":
          cmp = a.work_type.localeCompare(b.work_type);
          break;
        case "published_at":
          cmp =
            new Date(a.published_at).getTime() -
            new Date(b.published_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [jobs, tableSearch, tableCategory, tableExperience, tableWorkType, sortField, sortDir]);

  const totalPages = Math.ceil(processedJobs.length / PAGE_SIZE);

  const pageData = useMemo(() => {
    const start = page * PAGE_SIZE;
    return processedJobs.slice(start, start + PAGE_SIZE);
  }, [processedJobs, page]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No job postings match your filters
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Job Listings</CardTitle>
          <span className="text-sm text-muted-foreground">
            {processedJobs.length.toLocaleString()} results
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Table-level filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Input
              placeholder="Search within results..."
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setPage(0);
              }}
              className="h-8 text-sm pr-8"
            />
            {tableSearch && (
              <button
                onClick={() => {
                  setTableSearch("");
                  setPage(0);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select
            value={tableCategory}
            onValueChange={(v) => {
              setTableCategory(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Data Science">Data Science</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={tableExperience}
            onValueChange={(v) => {
              setTableExperience(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="No experience">No exp.</SelectItem>
              <SelectItem value="1-3 years">1-3 yrs</SelectItem>
              <SelectItem value="3-6 years">3-6 yrs</SelectItem>
              <SelectItem value="6+ years">6+ yrs</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={tableWorkType}
            onValueChange={(v) => {
              setTableWorkType(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="Work Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          {hasTableFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTableFilters}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="min-w-[200px] cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("title")}
                >
                  <span className="flex items-center">
                    Title <SortIconComponent field="title" currentField={sortField} currentDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className="min-w-[100px] cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("company")}
                >
                  <span className="flex items-center">
                    Company <SortIconComponent field="company" currentField={sortField} currentDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className="min-w-[130px] cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("salary")}
                >
                  <span className="flex items-center">
                    Salary <SortIconComponent field="salary" currentField={sortField} currentDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className="min-w-[80px] cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("region")}
                >
                  <span className="flex items-center">
                    Location <SortIconComponent field="region" currentField={sortField} currentDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className="min-w-[80px] cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("experience")}
                >
                  <span className="flex items-center">
                    Experience <SortIconComponent field="experience" currentField={sortField} currentDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className="min-w-[80px] cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort("work_type")}
                >
                  <span className="flex items-center">
                    Work <SortIconComponent field="work_type" currentField={sortField} currentDir={sortDir} />
                  </span>
                </TableHead>
                <TableHead className="min-w-[200px]">Skills</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((job) => (
                <TableRow key={job.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm leading-tight">
                        {job.title}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 ${getCategoryStyle(job.category)}`}
                      >
                        {job.category === "Data Science" ? "DS" : "IT"} •{" "}
                        {job.subcategory}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{job.company}</TableCell>
                  <TableCell className="text-sm font-mono">
                    {formatSalary(job)}
                  </TableCell>
                  <TableCell className="text-sm">{job.region}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${getExperienceColor(job.experience)}`}
                    >
                      {job.experience}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        job.work_type === "Remote"
                          ? "border-emerald-300 text-emerald-700 dark:text-emerald-400"
                          : job.work_type === "Hybrid"
                          ? "border-violet-300 text-violet-700 dark:text-violet-400"
                          : ""
                      }`}
                    >
                      {job.work_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {job.skills.slice(0, 4).map((s) => (
                        <Badge
                          key={s}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {s}
                        </Badge>
                      ))}
                      {job.skills.length > 4 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          +{job.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, processedJobs.length)} of{" "}
            {processedJobs.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

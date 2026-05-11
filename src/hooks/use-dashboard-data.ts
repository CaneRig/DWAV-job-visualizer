"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  JobPosting,
  DashboardData,
  DashboardFilters,
  ExperienceLevel,
} from "@/lib/types";

const RUB_RATES: Record<string, number> = { RUB: 1, USD: 90, EUR: 95 };

function salaryToRub(from: number | null, to: number | null, currency: string): number | null {
  if (from === null && to === null) return null;
  const rate = RUB_RATES[currency] || 1;
  const avg = ((from || 0) + (to || 0)) / 2;
  return Math.round(avg * rate);
}

export function useDashboardData() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({
    category: "all",
    region: "all",
    experience: "all",
    remote: "all",
    search: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
        const [jobsRes, statsRes] = await Promise.all([
          fetch(`${base}/data/jobs.json`),
          fetch(`${base}/data/stats.json`),
        ]);
        const jobsData: JobPosting[] = await jobsRes.json();
        const statsData: DashboardData = await statsRes.json();
        setJobs(jobsData);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filters.category !== "all" && job.category !== filters.category)
        return false;
      if (filters.region !== "all" && job.region !== filters.region)
        return false;
      if (filters.experience !== "all" && job.experience !== filters.experience)
        return false;
      if (filters.remote !== "all" && job.work_type !== filters.remote)
        return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.skills.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [jobs, filters]);

  const filteredStats = useMemo(() => {
    const fJobs = filteredJobs;
    if (fJobs.length === 0) return null;

    const salaryValues = fJobs
      .map((j) => salaryToRub(j.salary_from, j.salary_to, j.salary_currency))
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    const avgSalary =
      salaryValues.length > 0
        ? Math.round(
            salaryValues.reduce((a, b) => a + b, 0) / salaryValues.length
          )
        : 0;
    const medianSalary =
      salaryValues.length > 0
        ? salaryValues[Math.floor(salaryValues.length / 2)]
        : 0;

    const skillCounts: Record<string, number> = {};
    fJobs.forEach((j) =>
      j.skills.forEach((s) => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      })
    );
    const topSkill = Object.entries(skillCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "—";

    const locCounts: Record<string, number> = {};
    fJobs.forEach((j) => {
      locCounts[j.region] = (locCounts[j.region] || 0) + 1;
    });
    const topLocation = Object.entries(locCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "—";

    const remoteCount = fJobs.filter((j) => j.remote).length;
    const remotePct = Math.round((remoteCount / fJobs.length) * 100);

    return {
      total_jobs: fJobs.length,
      avg_salary_rub: avgSalary,
      median_salary_rub: medianSalary,
      top_category:
        fJobs.filter((j) => j.category === "IT").length >
        fJobs.filter((j) => j.category === "Data Science").length
          ? "IT"
          : "Data Science",
      remote_percentage: remotePct,
      top_skill: topSkill,
      top_location: topLocation,
    };
  }, [filteredJobs]);

  // Computed chart data from filtered jobs
  const chartData = useMemo(() => {
    const fJobs = filteredJobs;
    if (fJobs.length === 0) return null;

    // Salary distribution
    const salaryBuckets = [
      "0-50k", "50k-100k", "100k-150k", "150k-200k", "200k-250k",
      "250k-300k", "300k-350k", "350k-400k", "400k-450k", "450k-500k",
      "500k-550k", "550k-600k", "600k+",
    ];
    const salaryDistribution = salaryBuckets.map((bucket) => {
      let min: number, max: number;
      if (bucket === "600k+") {
        min = 600000;
        max = Infinity;
      } else {
        const parts = bucket.replaceAll("k", "000").split("-");
        min = parseInt(parts[0]);
        max = parseInt(parts[1]);
      }
      let ds = 0,
        it = 0;
      fJobs.forEach((j) => {
        const rub = salaryToRub(
          j.salary_from,
          j.salary_to,
          j.salary_currency
        );
        if (rub !== null && rub >= min && rub < max) {
          if (j.category === "Data Science") ds++;
          else it++;
        }
      });
      return { range: bucket, count: ds + it, data_science: ds, it };
    });

    // Top skills
    const skillData: Record<string, { skill: string; count: number; data_science: number; it: number }> = {};
    fJobs.forEach((j) => {
      j.skills.forEach((s) => {
        if (!skillData[s])
          skillData[s] = { skill: s, count: 0, data_science: 0, it: 0 };
        skillData[s].count++;
        if (j.category === "Data Science") skillData[s].data_science++;
        else skillData[s].it++;
      });
    });
    const topSkills = Object.values(skillData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    // Geographic distribution
    const geoData: Record<string, { region: string; count: number; salaries: number[] }> = {};
    fJobs.forEach((j) => {
      if (!geoData[j.region])
        geoData[j.region] = { region: j.region, count: 0, salaries: [] };
      geoData[j.region].count++;
      const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
      if (rub !== null) geoData[j.region].salaries.push(rub);
    });
    const geographicDistribution = Object.values(geoData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((g) => ({
        region: g.region,
        count: g.count,
        avg_salary:
          g.salaries.length > 0
            ? Math.round(
                g.salaries.reduce((a, b) => a + b, 0) / g.salaries.length
              )
            : 0,
      }));

    // Experience distribution
    const expLevels: ExperienceLevel[] = [
      "No experience",
      "1-3 years",
      "3-6 years",
      "6+ years",
    ];
    const expData: Record<string, { count: number; salaries: number[] }> = {};
    expLevels.forEach((l) => (expData[l] = { count: 0, salaries: [] }));
    fJobs.forEach((j) => {
      expData[j.experience].count++;
      const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
      if (rub !== null) expData[j.experience].salaries.push(rub);
    });
    const experienceDistribution = expLevels.map((level) => ({
      level,
      count: expData[level].count,
      avg_salary:
        expData[level].salaries.length > 0
          ? Math.round(
              expData[level].salaries.reduce((a, b) => a + b, 0) /
                expData[level].salaries.length
            )
          : 0,
    }));

    // Category distribution
    const catData: Record<string, { category: string; subcategory: string; count: number; salaries: number[] }> = {};
    fJobs.forEach((j) => {
      if (!catData[j.subcategory])
        catData[j.subcategory] = {
          category: j.category,
          subcategory: j.subcategory,
          count: 0,
          salaries: [],
        };
      catData[j.subcategory].count++;
      const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
      if (rub !== null) catData[j.subcategory].salaries.push(rub);
    });
    const categoryDistribution = Object.values(catData)
      .sort((a, b) => b.count - a.count)
      .map((c) => ({
        category: c.category,
        subcategory: c.subcategory,
        count: c.count,
        avg_salary:
          c.salaries.length > 0
            ? Math.round(
                c.salaries.reduce((a, b) => a + b, 0) / c.salaries.length
              )
            : 0,
      }));

    // Remote distribution
    const remoteDist: Record<string, number> = { Remote: 0, "On-site": 0, Hybrid: 0 };
    fJobs.forEach((j) => {
      remoteDist[j.work_type] = (remoteDist[j.work_type] || 0) + 1;
    });
    const remoteDistribution = (
      ["Remote", "On-site", "Hybrid"] as const
    ).map((type) => ({ type, count: remoteDist[type] || 0 }));

    // Employment distribution
    const empDist: Record<string, number> = {};
    fJobs.forEach((j) => {
      empDist[j.employment_type] = (empDist[j.employment_type] || 0) + 1;
    });
    const employmentDistribution = Object.entries(empDist)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Top companies
    const compData: Record<string, { company: string; count: number; salaries: number[] }> = {};
    fJobs.forEach((j) => {
      if (!compData[j.company])
        compData[j.company] = { company: j.company, count: 0, salaries: [] };
      compData[j.company].count++;
      const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
      if (rub !== null) compData[j.company].salaries.push(rub);
    });
    const topCompanies = Object.values(compData)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
      .map((c) => ({
        company: c.company,
        count: c.count,
        avg_salary:
          c.salaries.length > 0
            ? Math.round(
                c.salaries.reduce((a, b) => a + b, 0) / c.salaries.length
              )
            : 0,
      }));

    // Skill correlation
    const skillCorr: Record<string, { skill: string; data_science_count: number; it_count: number }> = {};
    fJobs.forEach((j) => {
      j.skills.forEach((s) => {
        if (!skillCorr[s])
          skillCorr[s] = {
            skill: s,
            data_science_count: 0,
            it_count: 0,
          };
        if (j.category === "Data Science") skillCorr[s].data_science_count++;
        else skillCorr[s].it_count++;
      });
    });
    const skillCorrelation = Object.values(skillCorr)
      .sort(
        (a, b) =>
          b.data_science_count + b.it_count - (a.data_science_count + a.it_count)
      )
      .slice(0, 25);

    // Salary by category
    const salaryByCat: Record<string, { category: string; subcategory: string; salaries: number[] }> = {};
    fJobs.forEach((j) => {
      if (!salaryByCat[j.subcategory])
        salaryByCat[j.subcategory] = {
          category: j.category,
          subcategory: j.subcategory,
          salaries: [],
        };
      const rub = salaryToRub(j.salary_from, j.salary_to, j.salary_currency);
      if (rub !== null) salaryByCat[j.subcategory].salaries.push(rub);
    });
    const salaryByCategory = Object.values(salaryByCat)
      .filter((s) => s.salaries.length > 0)
      .map((s) => {
        const sorted = [...s.salaries].sort((a, b) => a - b);
        return {
          category: s.category,
          subcategory: s.subcategory,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
          median: sorted[Math.floor(sorted.length / 2)],
          count: sorted.length,
        };
      })
      .sort((a, b) => b.count - a.count);

    // Timeline
    const now = new Date();
    const timelineData: Record<string, { date: string; count: number; data_science: number; it: number }> = {};
    for (let d = 29; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const key = date.toISOString().split("T")[0];
      timelineData[key] = { date: key, count: 0, data_science: 0, it: 0 };
    }
    fJobs.forEach((j) => {
      const key = j.published_at.split("T")[0];
      if (timelineData[key]) {
        timelineData[key].count++;
        if (j.category === "Data Science") timelineData[key].data_science++;
        else timelineData[key].it++;
      }
    });
    const timeline = Object.values(timelineData).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return {
      salary_distribution: salaryDistribution,
      top_skills: topSkills,
      geographic_distribution: geographicDistribution,
      experience_distribution: experienceDistribution,
      category_distribution: categoryDistribution,
      remote_distribution: remoteDistribution,
      employment_distribution: employmentDistribution,
      top_companies: topCompanies,
      skill_correlation: skillCorrelation,
      salary_by_category: salaryByCategory,
      timeline,
    };
  }, [filteredJobs]);

  const uniqueRegions = useMemo(() => {
    const regions = new Set(jobs.map((j) => j.region));
    return Array.from(regions).sort();
  }, [jobs]);

  const updateFilter = useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      category: "all",
      region: "all",
      experience: "all",
      remote: "all",
      search: "",
    });
  }, []);

  return {
    jobs,
    filteredJobs,
    stats: stats?.stats ?? null,
    chartData,
    filteredStats,
    filters,
    uniqueRegions,
    loading,
    updateFilter,
    resetFilters,
  };
}

"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/header";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { SalaryDistChart } from "@/components/dashboard/salary-chart";
import { SkillsChart } from "@/components/dashboard/skills-chart";
import { GeographyChart } from "@/components/dashboard/geography-chart";
import { ExperienceChart } from "@/components/dashboard/experience-chart";
import { RemoteChart } from "@/components/dashboard/remote-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import { CompaniesChart } from "@/components/dashboard/companies-chart";
import { SalaryByCategoryChart } from "@/components/dashboard/salary-by-category-chart";
import { SkillCorrelationChart } from "@/components/dashboard/skill-correlation-chart";
import { EmploymentChart } from "@/components/dashboard/employment-chart";
import { JobTable } from "@/components/dashboard/job-table";
import { SalaryExperienceChart } from "@/components/dashboard/salary-experience-chart";
import { SalaryComparisonChart } from "@/components/dashboard/salary-comparison-chart";
import { SkillsBubbleChart } from "@/components/dashboard/skills-bubble-chart";
import { SkillsRadarChart } from "@/components/dashboard/skills-radar-chart";
import { CategorySkillsChart } from "@/components/dashboard/category-skills-chart";
import { CompanySalaryChart } from "@/components/dashboard/company-salary-chart";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  DollarSign,
  Cpu,
  Building2,
  List,
} from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[350px]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    filteredJobs,
    filteredStats,
    chartData,
    filters,
    uniqueRegions,
    loading,
    updateFilter,
    resetFilters,
  } = useDashboardData();

  const [activeTab, setActiveTab] = useState("overview");

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards - always visible */}
        <KPICards data={filteredStats} />

        {/* Global Filters - always visible */}
        <FilterBar
          filters={filters}
          uniqueRegions={uniqueRegions}
          onUpdate={updateFilter}
          onReset={resetFilters}
          resultCount={filteredJobs.length}
        />

        <Separator />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <LayoutDashboard className="h-4 w-4 hidden sm:inline" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="salary" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 hidden sm:inline" />
              Salary
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-1.5 text-xs sm:text-sm">
              <Cpu className="h-4 w-4 hidden sm:inline" />
              Skills & Tech
            </TabsTrigger>
            <TabsTrigger
              value="companies"
              className="gap-1.5 text-xs sm:text-sm"
            >
              <Building2 className="h-4 w-4 hidden sm:inline" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-1.5 text-xs sm:text-sm">
              <List className="h-4 w-4 hidden sm:inline" />
              Listings
            </TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW TAB ─── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && (
                <SalaryDistChart data={chartData.salary_distribution} />
              )}
              {chartData && <TimelineChart data={chartData.timeline} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {chartData && <RemoteChart data={chartData.remote_distribution} />}
              {chartData && (
                <EmploymentChart data={chartData.employment_distribution} />
              )}
              {chartData && (
                <ExperienceChart data={chartData.experience_distribution} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && <CategoryChart data={chartData.category_distribution} />}
              {chartData && <GeographyChart data={chartData.geographic_distribution} />}
            </div>
          </TabsContent>

          {/* ─── SALARY ANALYSIS TAB ─── */}
          <TabsContent value="salary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && (
                <SalaryDistChart data={chartData.salary_distribution} />
              )}
              {chartData && (
                <SalaryExperienceChart
                  data={chartData.experience_distribution}
                />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && (
                <SalaryByCategoryChart data={chartData.salary_by_category} />
              )}
              {chartData && (
                <SalaryComparisonChart data={chartData.salary_by_category} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && (
                <GeographyChart data={chartData.geographic_distribution} />
              )}
              {chartData && (
                <ExperienceChart data={chartData.experience_distribution} />
              )}
            </div>
          </TabsContent>

          {/* ─── SKILLS & TECH TAB ─── */}
          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && <SkillsChart data={chartData.top_skills} />}
              {chartData && (
                <SkillCorrelationChart data={chartData.skill_correlation} />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {chartData && (
                <SkillsBubbleChart data={chartData.skill_correlation} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && (
                <SkillsRadarChart data={chartData.skill_correlation} />
              )}
              {chartData && (
                <CategorySkillsChart
                  data={chartData.category_distribution}
                  jobs={filteredJobs}
                />
              )}
            </div>
          </TabsContent>

          {/* ─── COMPANIES & TIMELINE TAB ─── */}
          <TabsContent value="companies" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {chartData && <TimelineChart data={chartData.timeline} />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && <CompaniesChart data={chartData.top_companies} />}
              {chartData && (
                <CompanySalaryChart data={chartData.top_companies} />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {chartData && (
                <GeographyChart data={chartData.geographic_distribution} />
              )}
              {chartData && (
                <EmploymentChart data={chartData.employment_distribution} />
              )}
            </div>
          </TabsContent>

          {/* ─── LISTINGS TAB ─── */}
          <TabsContent value="listings" className="space-y-4">
            <JobTable jobs={filteredJobs} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">IT & Data Science Job Market Dashboard</span>
              <span>•</span>
              <span>Data from hh.ru</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{filteredJobs.length.toLocaleString()} postings</span>
              <span>•</span>
              <span>Deploy on GitHub Pages</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Core job posting data type
export interface JobPosting {
  id: string;
  title: string;
  company: string;
  category: "Data Science" | "IT";
  subcategory: string;
  salary_from: number | null;
  salary_to: number | null;
  salary_currency: string;
  salary_gross: boolean;
  location: string;
  region: string;
  remote: boolean;
  work_type: "Remote" | "On-site" | "Hybrid";
  experience: ExperienceLevel;
  employment_type: EmploymentType;
  skills: string[];
  published_at: string;
  url: string;
  description_snippet: string;
}

export type ExperienceLevel =
  | "No experience"
  | "1-3 years"
  | "3-6 years"
  | "6+ years";

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";

// Pre-aggregated dashboard statistics
export interface DashboardStats {
  total_jobs: number;
  avg_salary_rub: number;
  median_salary_rub: number;
  top_category: string;
  remote_percentage: number;
  top_skill: string;
  top_location: string;
  date_range: {
    from: string;
    to: string;
  };
}

// Chart data types
export interface SalaryDistribution {
  range: string;
  count: number;
  data_science: number;
  it: number;
}

export interface SkillFrequency {
  skill: string;
  count: number;
  data_science: number;
  it: number;
}

export interface GeographicDistribution {
  region: string;
  count: number;
  avg_salary: number;
}

export interface ExperienceDistribution {
  level: ExperienceLevel;
  count: number;
  avg_salary: number;
}

export interface CategoryDistribution {
  category: string;
  subcategory: string;
  count: number;
  avg_salary: number;
}

export interface EmploymentDistribution {
  type: EmploymentType;
  count: number;
}

export interface RemoteDistribution {
  type: "Remote" | "On-site" | "Hybrid";
  count: number;
}

export interface TimelineData {
  date: string;
  count: number;
  data_science: number;
  it: number;
}

export interface SalaryByCategory {
  category: string;
  subcategory: string;
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
}

export interface TopCompany {
  company: string;
  count: number;
  avg_salary: number;
}

export interface SkillCorrelation {
  skill: string;
  data_science_count: number;
  it_count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  salary_distribution: SalaryDistribution[];
  top_skills: SkillFrequency[];
  geographic_distribution: GeographicDistribution[];
  experience_distribution: ExperienceDistribution[];
  category_distribution: CategoryDistribution[];
  employment_distribution: EmploymentDistribution[];
  remote_distribution: RemoteDistribution[];
  timeline: TimelineData[];
  salary_by_category: SalaryByCategory[];
  top_companies: TopCompany[];
  skill_correlation: SkillCorrelation[];
}

// Filter types
export interface DashboardFilters {
  category: "all" | "Data Science" | "IT";
  region: string;
  experience: ExperienceLevel | "all";
  remote: "all" | "Remote" | "On-site" | "Hybrid";
  search: string;
}

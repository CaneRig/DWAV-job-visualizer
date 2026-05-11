"""
Aggregator for hh.ru Job Postings
=================================
Generates pre-aggregated statistics (DashboardData) from
cleaned job posting data.
"""

import json
import logging
import os
from collections import Counter, defaultdict
from datetime import datetime
from statistics import median
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def safe_median(values: List[float]) -> float:
    """Compute median safely, returning 0 for empty lists."""
    if not values:
        return 0
    return median(values)


def safe_avg(values: List[float]) -> float:
    """Compute average safely, returning 0 for empty lists."""
    if not values:
        return 0
    return sum(values) / len(values)


def get_salary_midpoint(job: Dict[str, Any]) -> Optional[float]:
    """Get a representative salary value for a job posting."""
    salary_from = job.get("salary_from")
    salary_to = job.get("salary_to")

    if salary_from is not None and salary_to is not None:
        return (salary_from + salary_to) / 2
    elif salary_from is not None:
        return float(salary_from)
    elif salary_to is not None:
        return float(salary_to)
    return None


def salary_to_range(salary: float) -> str:
    """Map a salary value to a bucket range string (50k RUB increments)."""
    if salary < 50000:
        return "0-50k"
    elif salary < 100000:
        return "50k-100k"
    elif salary < 150000:
        return "100k-150k"
    elif salary < 200000:
        return "150k-200k"
    elif salary < 250000:
        return "200k-250k"
    elif salary < 300000:
        return "250k-300k"
    elif salary < 350000:
        return "300k-350k"
    elif salary < 400000:
        return "350k-400k"
    elif salary < 450000:
        return "400k-450k"
    elif salary < 500000:
        return "450k-500k"
    elif salary < 550000:
        return "500k-550k"
    elif salary < 600000:
        return "550k-600k"
    else:
        return "600k+"


SALARY_RANGES = [
    "0-50k", "50k-100k", "100k-150k", "150k-200k", "200k-250k",
    "250k-300k", "300k-350k", "350k-400k", "400k-450k", "450k-500k",
    "500k-550k", "550k-600k", "600k+",
]


def date_to_week(date_str: str) -> str:
    """Convert ISO date string to week bucket (YYYY-WW)."""
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, AttributeError):
        return "unknown"


class DataAggregator:
    """Aggregates cleaned job data into dashboard statistics."""

    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def aggregate(self, jobs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate all aggregated statistics from cleaned job data."""
        logger.info(f"Aggregating statistics for {len(jobs)} jobs...")

        dashboard_data = {
            "stats": self._compute_stats(jobs),
            "salary_distribution": self._compute_salary_distribution(jobs),
            "top_skills": self._compute_top_skills(jobs, top_n=30),
            "geographic_distribution": self._compute_geographic_distribution(jobs),
            "experience_distribution": self._compute_experience_distribution(jobs),
            "category_distribution": self._compute_category_distribution(jobs),
            "employment_distribution": self._compute_employment_distribution(jobs),
            "remote_distribution": self._compute_remote_distribution(jobs),
            "timeline": self._compute_timeline(jobs),
            "salary_by_category": self._compute_salary_by_category(jobs),
            "top_companies": self._compute_top_companies(jobs, top_n=20),
            "skill_correlation": self._compute_skill_correlation(jobs, top_n=30),
        }

        logger.info("Aggregation complete.")
        return dashboard_data

    def _compute_stats(self, jobs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute overall summary statistics."""
        salaries = []
        for job in jobs:
            s = get_salary_midpoint(job)
            if s is not None:
                salaries.append(s)

        total = len(jobs)
        avg_salary = safe_avg(salaries) if salaries else 0
        med_salary = safe_median(salaries) if salaries else 0

        # Top category
        cat_counter = Counter(j.get("category", "IT") for j in jobs)
        top_category = cat_counter.most_common(1)[0][0] if cat_counter else "IT"

        # Remote percentage
        remote_count = sum(1 for j in jobs if j.get("remote", False))
        remote_pct = round(remote_count / total * 100, 1) if total else 0

        # Top skill
        all_skills = []
        for j in jobs:
            all_skills.extend(j.get("skills", []))
        skill_counter = Counter(all_skills)
        top_skill = skill_counter.most_common(1)[0][0] if skill_counter else "N/A"

        # Top location (use region for consistency with dashboard)
        loc_counter = Counter(j.get("region", "Unknown") for j in jobs)
        top_location = loc_counter.most_common(1)[0][0] if loc_counter else "Unknown"

        # Date range
        dates = []
        for j in jobs:
            pub = j.get("published_at", "")
            if pub:
                try:
                    dates.append(pub[:10])
                except (ValueError, IndexError):
                    pass
        date_range = {
            "from": min(dates) if dates else "",
            "to": max(dates) if dates else "",
        }

        return {
            "total_jobs": total,
            "avg_salary_rub": round(avg_salary),
            "median_salary_rub": round(med_salary),
            "top_category": top_category,
            "remote_percentage": remote_pct,
            "top_skill": top_skill,
            "top_location": top_location,
            "date_range": date_range,
        }

    def _compute_salary_distribution(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute salary distribution by range with DS/IT breakdown."""
        range_data = defaultdict(lambda: {"count": 0, "data_science": 0, "it": 0})

        for job in jobs:
            salary = get_salary_midpoint(job)
            if salary is None:
                continue

            r = salary_to_range(salary)
            range_data[r]["count"] += 1
            if job.get("category") == "Data Science":
                range_data[r]["data_science"] += 1
            else:
                range_data[r]["it"] += 1

        result = []
        for r in SALARY_RANGES:
            d = range_data.get(r, {"count": 0, "data_science": 0, "it": 0})
            result.append({
                "range": r,
                "count": d["count"],
                "data_science": d["data_science"],
                "it": d["it"],
            })

        return result

    def _compute_top_skills(
        self, jobs: List[Dict[str, Any]], top_n: int = 30
    ) -> List[Dict[str, Any]]:
        """Compute top skills with DS/IT breakdown."""
        skill_data = defaultdict(lambda: {"count": 0, "data_science": 0, "it": 0})

        for job in jobs:
            category = job.get("category", "IT")
            for skill in job.get("skills", []):
                skill_data[skill]["count"] += 1
                if category == "Data Science":
                    skill_data[skill]["data_science"] += 1
                else:
                    skill_data[skill]["it"] += 1

        sorted_skills = sorted(
            skill_data.items(), key=lambda x: x[1]["count"], reverse=True
        )

        return [
            {
                "skill": skill,
                "count": data["count"],
                "data_science": data["data_science"],
                "it": data["it"],
            }
            for skill, data in sorted_skills[:top_n]
        ]

    def _compute_geographic_distribution(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute job distribution by region with average salary."""
        region_data = defaultdict(lambda: {"count": 0, "salaries": []})

        for job in jobs:
            region = job.get("region", "Unknown")
            salary = get_salary_midpoint(job)
            region_data[region]["count"] += 1
            if salary is not None:
                region_data[region]["salaries"].append(salary)

        result = []
        for region, data in sorted(
            region_data.items(), key=lambda x: x[1]["count"], reverse=True
        ):
            result.append({
                "region": region,
                "count": data["count"],
                "avg_salary": round(safe_avg(data["salaries"])),
            })

        return result

    def _compute_experience_distribution(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute job distribution by experience level with average salary."""
        exp_data = defaultdict(lambda: {"count": 0, "salaries": []})

        exp_order = ["No experience", "1-3 years", "3-6 years", "6+ years"]

        for job in jobs:
            exp = job.get("experience", "No experience")
            salary = get_salary_midpoint(job)
            exp_data[exp]["count"] += 1
            if salary is not None:
                exp_data[exp]["salaries"].append(salary)

        result = []
        for level in exp_order:
            data = exp_data.get(level, {"count": 0, "salaries": []})
            result.append({
                "level": level,
                "count": data["count"],
                "avg_salary": round(safe_avg(data["salaries"])),
            })

        # Add any extra experience levels not in the standard order
        for level, data in exp_data.items():
            if level not in exp_order:
                result.append({
                    "level": level,
                    "count": data["count"],
                    "avg_salary": round(safe_avg(data["salaries"])),
                })

        return result

    def _compute_category_distribution(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute job distribution by category and subcategory with average salary."""
        cat_data = defaultdict(lambda: {"count": 0, "salaries": []})

        for job in jobs:
            category = job.get("category", "IT")
            subcategory = job.get("subcategory", "General IT")
            key = (category, subcategory)
            salary = get_salary_midpoint(job)
            cat_data[key]["count"] += 1
            if salary is not None:
                cat_data[key]["salaries"].append(salary)

        result = []
        for (category, subcategory), data in sorted(
            cat_data.items(), key=lambda x: x[1]["count"], reverse=True
        ):
            result.append({
                "category": category,
                "subcategory": subcategory,
                "count": data["count"],
                "avg_salary": round(safe_avg(data["salaries"])),
            })

        return result

    def _compute_employment_distribution(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute job distribution by employment type."""
        emp_counter = Counter(j.get("employment_type", "Full-time") for j in jobs)
        emp_order = ["Full-time", "Part-time", "Contract", "Internship"]

        result = []
        for etype in emp_order:
            count = emp_counter.get(etype, 0)
            if count > 0:
                result.append({"type": etype, "count": count})

        # Add any extra types
        for etype, count in emp_counter.items():
            if etype not in emp_order and count > 0:
                result.append({"type": etype, "count": count})

        return result

    def _compute_remote_distribution(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute remote vs on-site vs hybrid distribution."""
        # Use work_type field if available
        work_type_counter = Counter(j.get("work_type", "On-site") for j in jobs)

        result = [
            {"type": "Remote", "count": work_type_counter.get("Remote", 0)},
            {"type": "On-site", "count": work_type_counter.get("On-site", 0)},
            {"type": "Hybrid", "count": work_type_counter.get("Hybrid", 0)},
        ]
        return result

    def _compute_timeline(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute job posting timeline by date with DS/IT breakdown."""
        date_data = defaultdict(lambda: {"count": 0, "data_science": 0, "it": 0})

        for job in jobs:
            pub = job.get("published_at", "")
            if not pub:
                continue
            try:
                date_key = pub[:10]  # YYYY-MM-DD
            except (ValueError, IndexError):
                continue

            date_data[date_key]["count"] += 1
            if job.get("category") == "Data Science":
                date_data[date_key]["data_science"] += 1
            else:
                date_data[date_key]["it"] += 1

        result = []
        for date in sorted(date_data.keys()):
            d = date_data[date]
            result.append({
                "date": date,
                "count": d["count"],
                "data_science": d["data_science"],
                "it": d["it"],
            })

        return result

    def _compute_salary_by_category(
        self, jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Compute salary statistics by category and subcategory."""
        cat_salaries = defaultdict(list)

        for job in jobs:
            category = job.get("category", "IT")
            subcategory = job.get("subcategory", "General IT")
            key = (category, subcategory)
            salary = get_salary_midpoint(job)
            if salary is not None:
                cat_salaries[key].append(salary)

        result = []
        for (category, subcategory), salaries in sorted(
            cat_salaries.items(), key=lambda x: len(x[1]), reverse=True
        ):
            result.append({
                "category": category,
                "subcategory": subcategory,
                "min": round(min(salaries)) if salaries else 0,
                "max": round(max(salaries)) if salaries else 0,
                "avg": round(safe_avg(salaries)),
                "median": round(safe_median(salaries)),
                "count": len(salaries),
            })

        return result

    def _compute_top_companies(
        self, jobs: List[Dict[str, Any]], top_n: int = 20
    ) -> List[Dict[str, Any]]:
        """Compute top hiring companies with average salary."""
        company_data = defaultdict(lambda: {"count": 0, "salaries": []})

        for job in jobs:
            company = job.get("company", "Unknown")
            salary = get_salary_midpoint(job)
            company_data[company]["count"] += 1
            if salary is not None:
                company_data[company]["salaries"].append(salary)

        sorted_companies = sorted(
            company_data.items(), key=lambda x: x[1]["count"], reverse=True
        )

        return [
            {
                "company": company,
                "count": data["count"],
                "avg_salary": round(safe_avg(data["salaries"])),
            }
            for company, data in sorted_companies[:top_n]
        ]

    def _compute_skill_correlation(
        self, jobs: List[Dict[str, Any]], top_n: int = 30
    ) -> List[Dict[str, Any]]:
        """Compute skill correlation between Data Science and IT categories."""
        skill_data = defaultdict(lambda: {"data_science_count": 0, "it_count": 0})

        for job in jobs:
            category = job.get("category", "IT")
            for skill in job.get("skills", []):
                if category == "Data Science":
                    skill_data[skill]["data_science_count"] += 1
                else:
                    skill_data[skill]["it_count"] += 1

        # Sort by total count
        sorted_skills = sorted(
            skill_data.items(),
            key=lambda x: x[1]["data_science_count"] + x[1]["it_count"],
            reverse=True,
        )

        return [
            {
                "skill": skill,
                "data_science_count": data["data_science_count"],
                "it_count": data["it_count"],
            }
            for skill, data in sorted_skills[:top_n]
        ]

    def save(self, dashboard_data: Dict[str, Any]):
        """Save aggregated data to stats.json."""
        filepath = os.path.join(self.output_dir, "stats.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(dashboard_data, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved aggregated statistics to {filepath}")

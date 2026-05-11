"""
Data Processor for hh.ru Job Postings
=====================================
Cleans, normalizes, and transforms raw API data into the
standardized JobPosting schema.
"""

import logging
import os
import re
from typing import Any, Dict, List, Optional

import yaml

logger = logging.getLogger(__name__)


class DataProcessor:
    """Cleans and normalizes raw vacancy data from hh.ru API."""

    # Experience mapping from hh.ru API values
    EXPERIENCE_MAP = {
        "noExperience": "No experience",
        "between1And3": "1-3 years",
        "between3And6": "3-6 years",
        "moreThan6": "6+ years",
    }

    # Employment type mapping from hh.ru API schedule values
    EMPLOYMENT_MAP = {
        "fullDay": "Full-time",
        "shift": "Full-time",
        "flexible": "Full-time",
        "remote": "Full-time",
        "flyInFlyOut": "Full-time",
        "part": "Part-time",
        "project": "Contract",
    }

    # Schedule ID to employment type
    SCHEDULE_MAP = {
        "fullDay": "Full-time",
        "shift": "Full-time",
        "flexible": "Full-time",
        "remote": "Full-time",
        "flyInFlyOut": "Full-time",
    }

    # Employment ID mapping
    EMPLOYMENT_ID_MAP = {
        "full": "Full-time",
        "part": "Part-time",
        "project": "Contract",
    }

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.skill_normalization = self.config.get("skill_normalization", {})
        self.specialization_mapping = self.config.get("specialization_mapping", {})
        self.area_mapping = self.config.get("area_mapping", {})
        self.currency_rates = self.config.get("currency_rates", {"RUR": 1.0, "RUB": 1.0})
        self.ds_keywords = [
            kw.lower() for kw in self.config.get("data_science_keywords", [])
        ]
        self.seen_ids: set = set()

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        config_dir = os.path.dirname(os.path.abspath(config_path))
        config_path_abs = os.path.join(config_dir, os.path.basename(config_path))

        with open(config_path_abs, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def process_all(self, raw_vacancies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process all raw vacancies into cleaned JobPosting objects."""
        processed = []
        duplicates = 0
        errors = 0

        for raw in raw_vacancies:
            try:
                job = self.process_vacancy(raw)
                if job is None:
                    continue

                # Deduplication
                if job["id"] in self.seen_ids:
                    duplicates += 1
                    continue
                self.seen_ids.add(job["id"])

                processed.append(job)
            except Exception as e:
                errors += 1
                logger.debug(f"Error processing vacancy: {e}")
                continue

        logger.info(
            f"Processing complete: {len(processed)} jobs, "
            f"{duplicates} duplicates removed, {errors} errors"
        )
        return processed

    def process_vacancy(self, raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Transform a single raw vacancy into the JobPosting schema."""
        vacancy_id = str(raw.get("id", ""))
        if not vacancy_id:
            return None

        # Basic fields
        title = self._clean_text(raw.get("name", ""))
        if not title:
            return None

        company = self._extract_company(raw)
        salary_data = self._extract_salary(raw)
        location, region = self._extract_location(raw)
        remote = self._detect_remote(raw)
        experience = self._map_experience(raw)
        employment_type = self._map_employment(raw)
        skills = self._extract_skills(raw)
        published_at = raw.get("published_at", raw.get("created_at", ""))
        url = raw.get("alternate_url", f"https://hh.ru/vacancy/{vacancy_id}")
        description_snippet = self._clean_description(raw)

        # Category and subcategory
        category, subcategory = self._classify_category(raw, title, skills)

        # Determine work type (Remote/On-site/Hybrid)
        work_type = self._detect_work_type(raw, remote)

        job = {
            "id": vacancy_id,
            "title": title,
            "company": company,
            "category": category,
            "subcategory": subcategory,
            "salary_from": salary_data["from"],
            "salary_to": salary_data["to"],
            "salary_currency": salary_data["currency"],
            "salary_gross": salary_data["gross"],
            "location": location,
            "region": region,
            "remote": remote,
            "work_type": work_type,
            "experience": experience,
            "employment_type": employment_type,
            "skills": skills,
            "published_at": published_at,
            "url": url,
            "description_snippet": description_snippet,
        }

        return job

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text fields."""
        if not text:
            return ""
        # Remove excessive whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _extract_company(self, raw: Dict[str, Any]) -> str:
        """Extract company name from vacancy data."""
        employer = raw.get("employer", {})
        name = employer.get("name", "")
        return self._clean_text(name) if name else "Unknown"

    def _extract_salary(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and normalize salary information to RUB monthly."""
        salary = raw.get("salary") or {}
        salary_from = salary.get("from")
        salary_to = salary.get("to")
        currency = salary.get("currency", "RUR")
        gross = salary.get("gross", True)

        # Convert to RUB
        rate = self.currency_rates.get(currency, 1.0)
        if currency not in ("RUR", "RUB") and rate != 1.0:
            if salary_from is not None:
                salary_from = round(salary_from * rate)
            if salary_to is not None:
                salary_to = round(salary_to * rate)

        # Normalize RUR → RUB (same currency, different code)
        currency = "RUB"

        # Normalize gross (before tax) flag
        # hh.ru reports gross=True means before taxes
        return {
            "from": salary_from,
            "to": salary_to,
            "currency": currency,
            "gross": gross,
        }

    def _extract_location(self, raw: Dict[str, Any]) -> tuple:
        """Extract location and region from vacancy data."""
        area_data = raw.get("area", {})
        area_id = area_data.get("id")
        area_name = area_data.get("name", "Unknown")

        # Map area ID to region
        try:
            region = self.area_mapping.get(int(area_id), area_name)
        except (ValueError, TypeError):
            region = area_name

        # Also check address for more specific location
        address = raw.get("address", {})
        if address and address.get("city"):
            location = address["city"]
        else:
            location = area_name

        return location, region

    def _detect_remote(self, raw: Dict[str, Any]) -> bool:
        """Detect if the job is remote."""
        # Check schedule
        schedule = raw.get("schedule", {})
        if schedule and schedule.get("id") == "remote":
            return True

        # Check for remote in title or description
        title = (raw.get("name") or "").lower()
        description = (raw.get("snippet", {}).get("requirement") or "").lower()
        description += " " + (raw.get("snippet", {}).get("responsibility") or "").lower()
        description += " " + (raw.get("description") or "").lower()

        remote_keywords = [
            "удаленн", "remote", "дистанцион", "из дома", "work from home",
            "wfh", "home office", "telecommut",
        ]
        combined_text = title + " " + description
        for kw in remote_keywords:
            if kw in combined_text:
                return True

        # Check accept_temporary_applicants as a loose signal
        if raw.get("accept_temporary_applicants") and schedule and schedule.get("id") == "remote":
            return True

        return False

    def _detect_work_type(self, raw: Dict[str, Any], is_remote: bool) -> str:
        """Determine work type: Remote, On-site, or Hybrid."""
        schedule = raw.get("schedule", {})
        schedule_id = schedule.get("id", "")

        # If schedule is explicitly remote
        if schedule_id == "remote":
            # Check if it's hybrid by looking at address/office requirements
            address = raw.get("address", {})
            if address and address.get("city"):
                # Has a physical office location mentioned + remote schedule = hybrid
                description = (raw.get("description") or "").lower()
                hybrid_keywords = [
                    "гибрид", "hybrid", "смещенн", "частичн",
                    "офис+удален", "возможно посещение офиса",
                    "офис или удаленн",
                ]
                for kw in hybrid_keywords:
                    if kw in description:
                        return "Hybrid"
            return "Remote"

        # Check description for hybrid keywords
        description = (raw.get("description") or "").lower()
        title = (raw.get("name") or "").lower()
        combined = title + " " + description

        hybrid_keywords = [
            "гибрид", "hybrid", "смещенн", "офис+удален",
            "офис или удаленн", "возможно посещение офиса",
        ]
        for kw in hybrid_keywords:
            if kw in combined:
                return "Hybrid"

        # Remote detected but not from schedule
        if is_remote:
            return "Remote"

        return "On-site"

    def _map_experience(self, raw: Dict[str, Any]) -> str:
        """Map hh.ru experience level to our schema."""
        experience = raw.get("experience", {})
        exp_id = experience.get("id", "")
        return self.EXPERIENCE_MAP.get(exp_id, "No experience")

    def _map_employment(self, raw: Dict[str, Any]) -> str:
        """Map hh.ru employment type to our schema."""
        employment = raw.get("employment", {})
        emp_id = employment.get("id", "")

        if emp_id in self.EMPLOYMENT_ID_MAP:
            return self.EMPLOYMENT_ID_MAP[emp_id]

        # Fallback: check schedule
        schedule = raw.get("schedule", {})
        sched_id = schedule.get("id", "")
        if sched_id in self.EMPLOYMENT_MAP:
            return self.EMPLOYMENT_MAP[sched_id]

        return "Full-time"

    def _extract_skills(self, raw: Dict[str, Any]) -> List[str]:
        """Extract and normalize key skills from vacancy data."""
        skills = []

        # Primary source: key_skills field (from detail endpoint)
        for skill_obj in raw.get("key_skills", []):
            skill_name = skill_obj.get("name", "").strip()
            if skill_name:
                normalized = self._normalize_skill(skill_name)
                if normalized and normalized not in skills:
                    skills.append(normalized)

        # Also extract from description/snippet if few skills found
        if len(skills) < 3:
            extracted = self._extract_skills_from_text(raw)
            for s in extracted:
                if s not in skills:
                    skills.append(s)

        return skills[:20]  # Cap at 20 skills

    def _normalize_skill(self, skill: str) -> str:
        """Normalize a skill name using the mapping."""
        # First try exact match
        if skill in self.skill_normalization:
            return self.skill_normalization[skill]

        # Try case-insensitive match
        skill_lower = skill.lower()
        for key, value in self.skill_normalization.items():
            if key.lower() == skill_lower:
                return value

        # Return cleaned original
        cleaned = self._clean_text(skill)
        # Remove version numbers like "Python3" -> "Python"
        cleaned = re.sub(r"(\w+)(\d+)$", r"\1", cleaned)

        return cleaned if cleaned else skill

    def _extract_skills_from_text(self, raw: Dict[str, Any]) -> List[str]:
        """Extract skill mentions from vacancy text content."""
        common_skills = [
            "Python", "Java", "JavaScript", "TypeScript", "C++", "C#",
            "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala",
            "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
            "Docker", "Kubernetes", "Git", "Linux", "AWS", "Azure", "GCP",
            "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
            "React", "Angular", "Vue", "Node.js", "Django", "Flask",
            "Spring", "REST API", "CI/CD", "Jenkins", "Terraform",
            "Ansible", "Apache Spark", "Hadoop", "Kafka", "RabbitMQ",
            "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
            "Data Science", "Airflow", "Tableau", "Power BI",
        ]

        text_parts = []
        snippet = raw.get("snippet", {})
        if snippet:
            text_parts.append(snippet.get("requirement", "") or "")
            text_parts.append(snippet.get("responsibility", "") or "")

        # Also check description (HTML)
        desc = raw.get("description", "")
        if desc:
            # Strip HTML tags for skill extraction
            clean_desc = re.sub(r"<[^>]+>", " ", desc)
            text_parts.append(clean_desc)

        combined = " ".join(text_parts).lower()
        found = []

        for skill in common_skills:
            if skill.lower() in combined:
                normalized = self._normalize_skill(skill)
                if normalized not in found:
                    found.append(normalized)

        return found

    def _classify_category(
        self, raw: Dict[str, Any], title: str, skills: List[str]
    ) -> tuple:
        """Classify vacancy as 'Data Science' or 'IT' and determine subcategory."""
        # Get specialization from raw data
        specializations = raw.get("specializations", [])
        spec_id = ""
        for spec in specializations:
            prof_id = spec.get("profarea_id", "")
            spec_field = spec.get("id", "")
            if spec_field:
                spec_id = spec_field
                break

        # If no spec_id from specializations, try to infer from search metadata
        # The search query's specialization is not in the detail response,
        # but we can use the professional area
        if not spec_id and specializations:
            spec_id = specializations[0].get("id", "")

        # Get subcategory from mapping
        subcategory = self.specialization_mapping.get(spec_id, "General IT")

        # Classify as Data Science or IT based on keywords
        title_lower = title.lower()
        skills_lower = [s.lower() for s in skills]
        combined_text = title_lower + " " + " ".join(skills_lower)

        ds_score = 0
        for keyword in self.ds_keywords:
            if keyword.lower() in combined_text:
                ds_score += 1

        # Also check specialization IDs associated with DS
        ds_spec_ids = {"1.221", "1.9"}
        if any(s.get("id", "").startswith("1.221") or s.get("id", "").startswith("1.9")
               for s in specializations):
            ds_score += 2

        category = "Data Science" if ds_score >= 1 else "IT"

        # Update subcategory for Data Science jobs
        if category == "Data Science" and subcategory == "General IT":
            if "machine learning" in combined_text or "ml" in skills_lower:
                subcategory = "Data Science / Machine Learning"
            elif "analyst" in combined_text or "аналитик" in combined_text:
                subcategory = "Analyst"
            elif "data engineer" in combined_text or "инженер данных" in combined_text:
                subcategory = "Data Science / Machine Learning"
            else:
                subcategory = "Data Science / Machine Learning"

        return category, subcategory

    def _clean_description(self, raw: Dict[str, Any]) -> str:
        """Extract and clean a short description snippet."""
        snippet = raw.get("snippet", {})
        parts = []

        requirement = snippet.get("requirement", "") or ""
        responsibility = snippet.get("responsibility", "") or ""

        # Clean HTML tags from snippet (hh.ru sometimes includes them)
        requirement = re.sub(r"<[^>]+>", "", requirement)
        responsibility = re.sub(r"<[^>]+>", "", responsibility)

        if requirement:
            parts.append(requirement.strip())
        if responsibility:
            parts.append(responsibility.strip())

        # Fallback to description field
        if not parts:
            desc = raw.get("description", "")
            if desc:
                desc = re.sub(r"<[^>]+>", " ", desc)
                desc = re.sub(r"\s+", " ", desc).strip()
                parts.append(desc[:500])

        combined = " | ".join(parts)
        return self._clean_text(combined)[:1000]  # Cap length

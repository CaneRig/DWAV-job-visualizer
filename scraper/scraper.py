"""
hh.ru Job Vacancy Scraper
=========================
Fetches job postings from the hh.ru public API with rate limiting,
error handling, and resume capability.
"""

import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests
import yaml

logger = logging.getLogger(__name__)


class RateLimiter:
    """Token bucket rate limiter to respect hh.ru API limits."""

    def __init__(self, requests_per_minute: int = 28):
        self.requests_per_minute = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request_time = 0.0

    def wait(self):
        """Block until it's safe to make the next request."""
        now = time.monotonic()
        elapsed = now - self.last_request_time
        if elapsed < self.interval:
            sleep_time = self.interval - elapsed
            logger.debug(f"Rate limiter: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_request_time = time.monotonic()


class ScraperState:
    """Tracks scraping progress for resume capability."""

    def __init__(self, state_file: str):
        self.state_file = state_file
        self.scraped_ids: set = set()
        self.completed_queries: List[str] = []
        self.last_updated: Optional[str] = None

    def load(self):
        """Load state from file if it exists."""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.scraped_ids = set(data.get("scraped_ids", []))
                self.completed_queries = data.get("completed_queries", [])
                self.last_updated = data.get("last_updated")
                logger.info(
                    f"Loaded state: {len(self.scraped_ids)} IDs already scraped, "
                    f"{len(self.completed_queries)} queries completed"
                )
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Could not load state file: {e}. Starting fresh.")
                self.scraped_ids = set()
                self.completed_queries = []
        else:
            logger.info("No state file found. Starting fresh.")

    def save(self):
        """Save current state to file."""
        self.last_updated = datetime.now().isoformat()
        data = {
            "scraped_ids": list(self.scraped_ids),
            "completed_queries": self.completed_queries,
            "last_updated": self.last_updated,
        }
        tmp_file = self.state_file + ".tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_file, self.state_file)

    def mark_query_completed(self, query_key: str):
        """Mark a search query as fully completed."""
        if query_key not in self.completed_queries:
            self.completed_queries.append(query_key)
        self.save()

    def is_query_completed(self, query_key: str) -> bool:
        """Check if a search query was already completed."""
        return query_key in self.completed_queries

    def add_scraped_id(self, vacancy_id: str):
        """Add a vacancy ID to the set of already-scraped IDs."""
        self.scraped_ids.add(vacancy_id)

    def has_id(self, vacancy_id: str) -> bool:
        """Check if a vacancy ID was already scraped."""
        return vacancy_id in self.scraped_ids


class HhRuScraper:
    """Main scraper class for hh.ru job vacancies API."""

    BASE_URL = "https://api.hh.ru/vacancies"
    DETAIL_URL = "https://api.hh.ru/vacancies/{}"
    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.rate_limiter = RateLimiter(
            self.config.get("requests_per_minute", 28)
        )
        self.state = ScraperState(self.config.get("state_file", "scraper_state.json"))
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": self.USER_AGENT,
                "Accept": "application/json",
            }
        )
        self.raw_vacancies: List[Dict[str, Any]] = []

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        config_dir = os.path.dirname(os.path.abspath(config_path))
        config_path = os.path.join(config_dir, os.path.basename(config_path))

        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)

        # Ensure output directory is relative to scraper dir
        if not os.path.isabs(config.get("output_dir", "output")):
            config["output_dir"] = os.path.join(
                os.path.dirname(os.path.abspath(config_path)),
                config.get("output_dir", "output"),
            )

        return config

    def _make_request(
        self, url: str, params: Optional[Dict] = None, max_retries: Optional[int] = None
    ) -> Optional[requests.Response]:
        """Make an API request with rate limiting and retry logic."""
        retries = max_retries or self.config.get("max_retries", 3)
        backoff = self.config.get("backoff_factor", 1)

        for attempt in range(retries + 1):
            self.rate_limiter.wait()
            try:
                response = self.session.get(url, params=params, timeout=30)

                if response.status_code == 200:
                    return response

                elif response.status_code == 429:
                    # Rate limited - wait longer
                    retry_after = int(response.headers.get("Retry-After", 60))
                    logger.warning(
                        f"Rate limited (429). Waiting {retry_after}s before retry..."
                    )
                    time.sleep(retry_after)
                    continue

                elif response.status_code == 403:
                    logger.error(
                        f"Forbidden (403) for {url}. Response: {response.text[:200]}"
                    )
                    # Don't retry 403s immediately - they might be temporary blocks
                    if attempt < retries:
                        wait_time = backoff * (2 ** attempt) + 60
                        logger.info(f"Waiting {wait_time}s before retry...")
                        time.sleep(wait_time)
                    continue

                elif response.status_code == 404:
                    logger.debug(f"Not found (404) for {url}")
                    return None

                else:
                    logger.warning(
                        f"HTTP {response.status_code} for {url}: {response.text[:200]}"
                    )
                    if attempt < retries:
                        wait_time = backoff * (2 ** attempt)
                        time.sleep(wait_time)
                    continue

            except requests.exceptions.Timeout:
                logger.warning(f"Timeout on attempt {attempt + 1}/{retries + 1}")
                if attempt < retries:
                    wait_time = backoff * (2 ** attempt)
                    time.sleep(wait_time)
                continue

            except requests.exceptions.ConnectionError as e:
                logger.warning(f"Connection error on attempt {attempt + 1}: {e}")
                if attempt < retries:
                    wait_time = backoff * (2 ** attempt) + 5
                    time.sleep(wait_time)
                continue

        logger.error(f"All {retries + 1} attempts failed for {url}")
        return None

    def _get_query_key(self, query: Dict, area: int, date_from: str, date_to: str) -> str:
        """Generate a unique key for a search query combination."""
        return f"{query['text']}|{query['specialization']}|{area}|{date_from}|{date_to}"

    def search_vacancies(
        self, query: Dict, area: int, date_from: str, date_to: str
    ) -> List[Dict[str, Any]]:
        """
        Search for vacancies using the hh.ru search endpoint.
        Returns a list of vacancy summary objects.
        """
        query_key = self._get_query_key(query, area, date_from, date_to)

        if self.state.is_query_completed(query_key):
            logger.info(f"Skipping completed query: {query_key}")
            return []

        all_vacancies = []
        page = 0
        has_more = True

        while has_more:
            params = {
                "text": query["text"],
                "specialization": query["specialization"],
                "area": area,
                "per_page": 100,
                "page": page,
                "date_from": date_from,
                "date_to": date_to,
                "order_by": "publication_time",
            }

            logger.info(
                f"Searching: text='{query['text']}', spec={query['specialization']}, "
                f"area={area}, page={page}"
            )

            response = self._make_request(self.BASE_URL, params=params)
            if response is None:
                logger.warning(f"No response for query page {page}. Moving on.")
                break

            try:
                data = response.json()
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response for page {page}")
                break

            found = data.get("found", 0)
            pages = data.get("pages", 0)
            items = data.get("items", [])

            if page == 0:
                logger.info(f"Found {found} vacancies across {pages} pages")

            for item in items:
                vacancy_id = item.get("id")
                if vacancy_id and not self.state.has_id(vacancy_id):
                    all_vacancies.append(item)
                    self.state.add_scraped_id(vacancy_id)

            # Save state periodically
            if page % 5 == 0:
                self.state.save()

            page += 1
            has_more = page < pages and page < 20  # Cap at 20 pages per query (2000 results max)

            if not items:
                break

        self.state.mark_query_completed(query_key)
        logger.info(f"Collected {len(all_vacancies)} new vacancy IDs from query: {query_key}")
        return all_vacancies

    def fetch_vacancy_detail(self, vacancy_id: str) -> Optional[Dict[str, Any]]:
        """Fetch full details for a single vacancy."""
        url = self.DETAIL_URL.format(vacancy_id)
        response = self._make_request(url)

        if response is None:
            return None

        try:
            return response.json()
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON for vacancy {vacancy_id}")
            return None

    def run(self) -> List[Dict[str, Any]]:
        """
        Main entry point: run the full scraping pipeline.
        Returns a list of raw vacancy detail objects.
        """
        self.state.load()

        # Calculate date range
        date_range_days = self.config.get("date_range_days", 30)
        date_to = datetime.now().strftime("%Y-%m-%d")
        date_from = (datetime.now() - timedelta(days=date_range_days)).strftime("%Y-%m-%d")

        logger.info(f"Scraping date range: {date_from} to {date_to}")
        logger.info(f"Target count: {self.config.get('target_count', 5000)}")

        search_queries = self.config.get("search_queries", [])
        areas = self.config.get("areas", [1, 2])
        target_count = self.config.get("target_count", 5000)

        # Phase 1: Collect vacancy IDs from search
        vacancy_summaries = []
        for query in search_queries:
            if len(self.state.scraped_ids) >= target_count * 1.5:
                logger.info(
                    f"Collected enough IDs ({len(self.state.scraped_ids)}). "
                    f"Stopping search phase."
                )
                break

            for area in areas:
                if len(self.state.scraped_ids) >= target_count * 1.5:
                    break

                summaries = self.search_vacancies(query, area, date_from, date_to)
                vacancy_summaries.extend(summaries)

        logger.info(
            f"Search phase complete. Total new vacancy IDs to fetch: "
            f"{len(vacancy_summaries)}"
        )

        # Phase 2: Fetch detailed information for each vacancy
        self.raw_vacancies = []
        failed_ids = []

        try:
            from tqdm import tqdm
            iterator = tqdm(vacancy_summaries, desc="Fetching details", unit="vacancy")
        except ImportError:
            iterator = vacancy_summaries
            logger.info("Install tqdm for progress bar: pip install tqdm")

        for summary in iterator:
            vacancy_id = summary.get("id")
            if not vacancy_id:
                continue

            detail = self.fetch_vacancy_detail(vacancy_id)
            if detail:
                self.raw_vacancies.append(detail)
            else:
                failed_ids.append(vacancy_id)

            # Save progress every 100 vacancies
            if len(self.raw_vacancies) % 100 == 0:
                self.state.save()
                logger.info(
                    f"Progress: {len(self.raw_vacancies)} details fetched, "
                    f"{len(failed_ids)} failed"
                )

            # Check if we have enough
            if len(self.raw_vacancies) >= target_count:
                logger.info(f"Reached target of {target_count}. Stopping detail fetch.")
                break

        self.state.save()
        logger.info(
            f"Scraping complete. Fetched {len(self.raw_vacancies)} vacancy details, "
            f"{len(failed_ids)} failed."
        )

        if failed_ids:
            logger.warning(f"Failed to fetch {len(failed_ids)} vacancies")

        return self.raw_vacancies

    def save_raw_data(self, vacancies: List[Dict[str, Any]], filepath: str):
        """Save raw vacancy data to a JSON file."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(vacancies, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(vacancies)} raw vacancies to {filepath}")

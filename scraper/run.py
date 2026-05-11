#!/usr/bin/env python3
"""
hh.ru Job Scraper - Entry Point
================================
Orchestrates the full scraping pipeline:
  1. Scrape raw vacancy data from hh.ru API
  2. Clean and process into standardized format
  3. Generate aggregated statistics
  4. Export to JSON files

Usage:
    python run.py              # Full pipeline
    python run.py --skip-scrape # Skip scraping, reprocess existing raw data
    python run.py --scrape-only # Only scrape, don't process/aggregate
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime

# Ensure the script directory is in the path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from scraper import HhRuScraper
from processor import DataProcessor
from aggregator import DataAggregator


def setup_logging(config: dict):
    """Configure logging to both file and console."""
    log_file = os.path.join(SCRIPT_DIR, config.get("log_file", "scraper.log"))
    log_level = getattr(logging, config.get("log_level", "INFO").upper(), logging.INFO)

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    # File handler
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

    # Reduce noise from urllib3
    logging.getLogger("urllib3").setLevel(logging.WARNING)


def load_config() -> dict:
    """Load configuration from YAML file."""
    import yaml

    config_path = os.path.join(SCRIPT_DIR, "config.yaml")
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def ensure_output_dir(config: dict) -> str:
    """Ensure the output directory exists and return its path."""
    output_dir = config.get("output_dir", "output")
    if not os.path.isabs(output_dir):
        output_dir = os.path.join(SCRIPT_DIR, output_dir)
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def run_scrape(config: dict) -> list:
    """Run the scraping phase and return raw vacancy data."""
    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info("PHASE 1: Scraping job postings from hh.ru API")
    logger.info("=" * 60)

    start_time = time.time()
    scraper = HhRuScraper(config_path=os.path.join(SCRIPT_DIR, "config.yaml"))
    raw_vacancies = scraper.run()

    elapsed = time.time() - start_time
    logger.info(f"Scraping phase completed in {elapsed:.1f}s")
    logger.info(f"Collected {len(raw_vacancies)} raw vacancies")

    # Save raw data for potential reprocessing
    output_dir = ensure_output_dir(config)
    raw_path = os.path.join(output_dir, "raw_vacancies.json")
    scraper.save_raw_data(raw_vacancies, raw_path)

    return raw_vacancies


def run_process(config: dict, raw_vacancies: list) -> list:
    """Run the data processing phase and return cleaned jobs."""
    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info("PHASE 2: Cleaning and processing job data")
    logger.info("=" * 60)

    start_time = time.time()
    processor = DataProcessor(config_path=os.path.join(SCRIPT_DIR, "config.yaml"))
    cleaned_jobs = processor.process_all(raw_vacancies)

    elapsed = time.time() - start_time
    logger.info(f"Processing phase completed in {elapsed:.1f}s")
    logger.info(f"Produced {len(cleaned_jobs)} cleaned job postings")

    # Save cleaned data
    output_dir = ensure_output_dir(config)
    jobs_path = os.path.join(output_dir, "jobs.json")
    with open(jobs_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_jobs, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved cleaned jobs to {jobs_path}")

    return cleaned_jobs


def run_aggregate(config: dict, cleaned_jobs: list):
    """Run the aggregation phase and save statistics."""
    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info("PHASE 3: Generating aggregated statistics")
    logger.info("=" * 60)

    start_time = time.time()
    output_dir = ensure_output_dir(config)
    aggregator = DataAggregator(output_dir=output_dir)
    dashboard_data = aggregator.aggregate(cleaned_jobs)
    aggregator.save(dashboard_data)

    elapsed = time.time() - start_time
    logger.info(f"Aggregation phase completed in {elapsed:.1f}s")

    # Print summary
    stats = dashboard_data.get("stats", {})
    logger.info("-" * 60)
    logger.info("SUMMARY")
    logger.info("-" * 60)
    logger.info(f"  Total jobs:        {stats.get('total_jobs', 0)}")
    logger.info(f"  Avg salary (RUB):  {stats.get('avg_salary_rub', 0):,}")
    logger.info(f"  Median salary:     {stats.get('median_salary_rub', 0):,}")
    logger.info(f"  Top category:      {stats.get('top_category', 'N/A')}")
    logger.info(f"  Remote %:          {stats.get('remote_percentage', 0)}%")
    logger.info(f"  Top skill:         {stats.get('top_skill', 'N/A')}")
    logger.info(f"  Top location:      {stats.get('top_location', 'N/A')}")
    logger.info(f"  Date range:        {stats.get('date_range', {}).get('from', '')} - "
                f"{stats.get('date_range', {}).get('to', '')}")
    logger.info("-" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="hh.ru Job Scraper - Collect and analyze job postings"
    )
    parser.add_argument(
        "--skip-scrape",
        action="store_true",
        help="Skip scraping phase, reprocess existing raw data",
    )
    parser.add_argument(
        "--scrape-only",
        action="store_true",
        help="Only scrape, don't process or aggregate",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset state file to start fresh",
    )
    args = parser.parse_args()

    # Load configuration
    config = load_config()

    # Setup logging
    setup_logging(config)
    logger = logging.getLogger(__name__)

    logger.info("hh.ru Job Scraper starting...")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")

    # Handle reset
    if args.reset:
        state_file = os.path.join(SCRIPT_DIR, config.get("state_file", "scraper_state.json"))
        if os.path.exists(state_file):
            os.remove(state_file)
            logger.info(f"Removed state file: {state_file}")

    # Ensure output directory
    output_dir = ensure_output_dir(config)

    # Phase 1: Scrape
    if args.skip_scrape:
        logger.info("Skipping scrape phase (reusing existing raw data)")
        raw_path = os.path.join(output_dir, "raw_vacancies.json")
        if not os.path.exists(raw_path):
            logger.error(f"No raw data found at {raw_path}. Run without --skip-scrape first.")
            sys.exit(1)
        with open(raw_path, "r", encoding="utf-8") as f:
            raw_vacancies = json.load(f)
        logger.info(f"Loaded {len(raw_vacancies)} raw vacancies from cache")
    else:
        raw_vacancies = run_scrape(config)

    if args.scrape_only:
        logger.info("Scrape-only mode. Skipping processing and aggregation.")
        logger.info(f"Raw data saved to {output_dir}/raw_vacancies.json")
        return

    # Phase 2: Process
    cleaned_jobs = run_process(config, raw_vacancies)

    if not cleaned_jobs:
        logger.warning("No cleaned jobs produced. Check the logs for errors.")
        return

    # Phase 3: Aggregate
    run_aggregate(config, cleaned_jobs)

    logger.info("=" * 60)
    logger.info("All done! Output files:")
    logger.info(f"  {output_dir}/jobs.json   - Cleaned job postings")
    logger.info(f"  {output_dir}/stats.json  - Aggregated statistics")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()

# hh.ru Job Scraper

A comprehensive Python scraping tool for collecting and analyzing Data Science and IT job postings from the [hh.ru](https://hh.ru) public API.

## Features

- **API-based scraping** using the hh.ru public vacancies endpoint
- **Targeted search** for Data Science and IT job categories across major Russian cities
- **Rate limiting** (28 requests/minute, under the 30 req/min limit)
- **Resume capability** — tracks progress in a state file, can be safely interrupted and restarted
- **Deduplication** — removes duplicate job postings
- **Data cleaning**:
  - Salary normalization to RUB monthly
  - Currency conversion (USD, EUR, etc. → RUB)
  - Skill name normalization (e.g., "Python3" → "Python", "ML" → "Machine Learning")
  - Category classification (Data Science vs IT) based on title, skills, and specialization
  - Remote work detection from schedule and description
  - Experience and employment type mapping
- **Pre-aggregated statistics** for dashboard visualization
- **Progress tracking** with tqdm progress bars
- **Structured logging** to both console and file

## Prerequisites

- Python 3.8+
- pip

## Installation

```bash
cd scraper
pip install -r requirements.txt
```

## Usage

### Full pipeline (scrape → process → aggregate)

```bash
python run.py
```

### Skip scraping, reprocess existing raw data

```bash
python run.py --skip-scrape
```

### Only scrape, don't process/aggregate

```bash
python run.py --scrape-only
```

### Reset state and start fresh

```bash
python run.py --reset
```

## Configuration

Edit `config.yaml` to customize:

| Setting | Description | Default |
|---------|-------------|---------|
| `target_count` | Target number of cleaned job postings | 5000 |
| `search_queries` | List of search text + specialization pairs | (see config) |
| `areas` | City/region IDs to search | Moscow, St. Petersburg, etc. |
| `date_range_days` | How many days back to search | 30 |
| `request_delay_seconds` | Delay between API requests | 2.1 |
| `requests_per_minute` | Rate limit | 28 |
| `output_dir` | Output directory | "output" |
| `skill_normalization` | Skill name mappings | (see config) |
| `currency_rates` | Exchange rates to RUB | (see config) |

## Output Files

All output is written to `scraper/output/`:

| File | Description |
|------|-------------|
| `jobs.json` | Array of cleaned job posting objects |
| `stats.json` | Pre-aggregated dashboard statistics |
| `raw_vacancies.json` | Raw API responses (for reprocessing) |

### Job Posting Schema (`jobs.json`)

Each job posting contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | hh.ru vacancy ID |
| `title` | string | Job title |
| `company` | string | Company name |
| `category` | string | "Data Science" or "IT" |
| `subcategory` | string | E.g., "Programming", "Analyst" |
| `salary_from` | number/null | Lower salary bound (RUB) |
| `salary_to` | number/null | Upper salary bound (RUB) |
| `salary_currency` | string | Currency code (RUB) |
| `salary_gross` | boolean | Before-tax flag |
| `location` | string | City name |
| `region` | string | Region name |
| `remote` | boolean | Whether the job is remote |
| `experience` | string | Experience level |
| `employment_type` | string | Full-time/Part-time/Contract |
| `skills` | string[] | Normalized skill list |
| `published_at` | string | ISO timestamp |
| `url` | string | hh.ru vacancy URL |
| `description_snippet` | string | Short description |

### Statistics Schema (`stats.json`)

Contains pre-computed aggregations:
- **stats**: Overall summary (total jobs, avg/median salary, top category, etc.)
- **salary_distribution**: Salary buckets with DS/IT breakdown
- **top_skills**: Top 30 skills with DS/IT counts
- **geographic_distribution**: Jobs by region with avg salary
- **experience_distribution**: Jobs by experience level
- **category_distribution**: Jobs by category/subcategory
- **employment_distribution**: Jobs by employment type
- **remote_distribution**: Remote vs on-site vs hybrid
- **timeline**: Daily posting counts with DS/IT breakdown
- **salary_by_category**: Salary stats per category/subcategory
- **top_companies**: Top 20 hiring companies
- **skill_correlation**: DS vs IT skill overlap

## Architecture

```
scraper/
├── run.py            # Entry point - orchestrates the pipeline
├── scraper.py        # API scraping with rate limiting & resume
├── processor.py      # Data cleaning and normalization
├── aggregator.py     # Statistics generation
├── config.yaml       # All configuration
├── requirements.txt  # Python dependencies
├── README.md         # This file
└── output/           # Generated output files
    ├── jobs.json
    ├── stats.json
    └── raw_vacancies.json
```

## Rate Limiting

The scraper respects hh.ru's rate limits:
- **28 requests/minute** (conservative limit under the 30 req/min cap)
- **2.1 second delay** between requests by default
- **Automatic backoff** on 429 (Too Many Requests) responses
- **Retry with exponential backoff** on connection errors

## Resume Capability

The scraper saves its progress to `scraper_state.json`:
- Tracks all scraped vacancy IDs
- Tracks completed search queries
- On restart, skips already-completed queries and already-fetched vacancies
- Safe to interrupt with Ctrl+C and resume later

## Notes

- The hh.ru API does not require authentication for basic vacancy searches
- Salary data is optional — many postings don't include it
- The API returns paginated results (max 100 per page)
- Some vacancies may be archived or deleted between search and detail fetch
- Currency conversion rates in the config are approximate; update as needed

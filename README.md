# IT & Data Science Job Market Dashboard

An interactive dashboard analyzing 5,000+ job postings in IT and Data Science across Russia. Built with Next.js, TypeScript, and Recharts.

**Live site**: https://cane rig.github.io/DWAV-job-visualizer/

## Features

- **5 Tabbed Sections**: Overview, Salary Analysis, Skills & Tech, Companies & Timeline, Job Listings
- **6 KPI Cards**: Total postings, average/median salary, remote %, top skill, top location
- **15+ Interactive Charts**: Salary distribution, skills bubble chart, radar chart, category breakdown, timeline, companies, and more
- **Global + Local Filtering**: Dashboard-level filters + table-specific search, category, experience, and work-type filters
- **Sortable Job Listings**: Click any column header to sort ascending/descending
- **Dark/Light Theme**: System-aware theme switching
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Static Export**: Deployable on GitHub Pages with no backend required

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui
- **Charts**: Recharts with shadcn/ui chart components
- **Data**: Static JSON files (no backend needed)
- **Scraper**: Python 3 (hh.ru public API)
- **Deployment**: GitHub Pages via GitHub Actions

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

## Dashboard Tabs

### Overview
High-level summary of the job market:
- KPI Cards: Total postings, avg/median salary, remote %, top skill, top location
- Salary Distribution: Stacked bar chart by DS vs IT
- Postings Timeline: Area chart of daily posting volume
- Work Arrangement: Donut chart of Remote / On-site / Hybrid
- Employment Type: Donut chart
- Experience Level: Bar chart with salary breakdown
- Category Breakdown: Horizontal bar by subcategory
- Geographic Distribution: Bar chart by region

### Salary Analysis
Deep dive into compensation:
- Salary Distribution: Detailed stacked bar
- Salary by Experience: Dual-axis bar (postings + avg salary)
- Salary by Role: Horizontal bar of average salary per subcategory
- Salary Range Chart: Min/Median/Avg/Max per role
- Geographic Salary: Region comparison with avg salary
- Experience vs Salary: Experience level breakdown

### Skills & Tech
Technology landscape analysis:
- Top Skills: Horizontal stacked bar (DS vs IT)
- Skill Correlation: Grouped bar comparing DS vs IT demand
- Skills Landscape (Bubble): Scatter plot where position = DS/IT demand, size = total, color = dominant category
- Skills Radar: Radar chart comparing top 15 skill patterns
- Top Skills by Role: Per-subcategory skill breakdown (6 mini charts)

### Companies & Timeline
Hiring trends and employer analysis:
- Postings Timeline: Area chart with DS/IT stacking
- Top Companies: Horizontal bar by posting count
- Company Salary Overview: Horizontal bar by avg salary
- Geographic Distribution: Region comparison
- Employment Type Distribution: Donut chart

### Job Listings
Full searchable, sortable, filterable table:
- Sort: Click any column header (Title, Company, Salary, Location, Experience, Work Type)
- Filter: Category, Experience, Work Type, Free-text search
- Pagination: 20 items per page with navigation

---

## Data Pipeline

### Option 1: Use Sample Data (Default)

The project ships with 5,000 realistic sample job postings. No additional setup needed.

### Option 2: Scrape Real Data from hh.ru

```bash
cd scraper

# Install Python dependencies
pip install -r requirements.txt

# Run the scraper (full pipeline)
python run.py

# Copy output to dashboard data folder
cp output/jobs.json ../public/data/
cp output/stats.json ../public/data/
```

The scraper:
- Uses the hh.ru public API (no authentication needed)
- Targets Data Science and IT specializations
- Covers 7 major Russian cities
- Rate-limited to 28 requests/minute
- Supports resume after interruption
- Cleans and normalizes salary, skills, categories

## Project Structure

```
src/
  app/
    layout.tsx          # Root layout with theme provider
    page.tsx            # Main dashboard with 5 tabs
    globals.css         # Global styles
  components/
    dashboard/
      header.tsx          # Dashboard header
      kpi-cards.tsx       # KPI summary cards
      filter-bar.tsx      # Global filter controls
      salary-chart.tsx    # Salary distribution
      salary-experience-chart.tsx  # Salary by experience
      salary-comparison-chart.tsx  # Salary range per role
      skills-chart.tsx    # Top skills
      skills-bubble-chart.tsx      # Skills landscape scatter
      skills-radar-chart.tsx       # Skills radar DS vs IT
      category-skills-chart.tsx    # Skills per subcategory
      skill-correlation-chart.tsx  # DS vs IT grouped bar
      category-chart.tsx   # Category breakdown
      geography-chart.tsx  # Geographic distribution
      experience-chart.tsx # Experience levels
      remote-chart.tsx     # Work arrangement donut
      employment-chart.tsx # Employment type donut
      timeline-chart.tsx   # Postings timeline
      companies-chart.tsx  # Top companies
      company-salary-chart.tsx   # Company salary overview
      salary-by-category-chart.tsx # Salary by role
      job-table.tsx        # Sortable, filterable job listings
    ui/                 # shadcn/ui components
  hooks/
    use-dashboard-data.ts  # Data loading, filtering, chart computation
  lib/
    types.ts            # TypeScript type definitions
    utils.ts            # Utility functions
public/
  data/
    jobs.json           # 5000 job postings
    stats.json          # Pre-aggregated statistics
scraper/
  run.py                  # Entry point
  scraper.py              # hh.ru API scraper
  processor.py            # Data cleaning
  aggregator.py           # Statistics generation
  config.yaml             # Scraper configuration
  requirements.txt        # Python dependencies
.github/
  workflows/
    deploy.yml          # GitHub Pages deployment
```

## Configuration

### Static Export Config

The `next.config.ts` uses environment variables:

- `DEPLOY_TARGET=github-pages` -- Enables static export mode
- `BASE_PATH=/DWAV-job-visualizer` -- Sets base path for GitHub Pages

### Scraper Config

Edit `scraper/config.yaml` to customize:
- Search queries and specializations
- Target cities/regions
- Rate limiting
- Skill normalization mappings
- Currency conversion rates

## License

MIT

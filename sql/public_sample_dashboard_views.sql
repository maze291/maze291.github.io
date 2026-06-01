-- Public-safe DuckDB demo views for the GCC Analyst Market Tracker.
-- These views run on the anonymized 25-row public sample, not the private reviewed dataset.
-- The purpose is to demonstrate metric logic, dashboard view structure, and privacy-safe reporting patterns.

CREATE SCHEMA IF NOT EXISTS public_demo;

CREATE OR REPLACE VIEW public_demo.stg_public_sample AS
WITH raw AS (
    SELECT
        NULLIF(TRIM(sample_row), '') AS sample_row,
        TRY_CAST(NULLIF(snapshot_date, '') AS DATE) AS snapshot_date,
        NULLIF(TRIM(country), '') AS country,
        NULLIF(TRIM(city), '') AS city,
        NULLIF(TRIM(role_category), '') AS role_category,
        NULLIF(TRIM(seniority), '') AS seniority,
        NULLIF(TRIM(skills_detected), '') AS skills_detected,
        TRY_CAST(NULLIF(skill_count, '') AS INTEGER) AS skill_count,
        NULLIF(TRIM(posting_month), '') AS posting_month,
        NULLIF(TRIM(freshness_bucket), '') AS freshness_bucket,
        CASE WHEN LOWER(COALESCE(salary_listed, '')) = 'yes' THEN TRUE ELSE FALSE END AS salary_listed,
        NULLIF(TRIM(observation_type), '') AS observation_type,
        TRY_CAST(NULLIF(confidence_score, '') AS INTEGER) AS confidence_score
    FROM read_csv_auto(
        'docs/public-sample-may22.csv',
        header = true,
        all_varchar = true
    )
)
SELECT
    *,
    CASE
        WHEN confidence_score >= 80 THEN 'high'
        WHEN confidence_score >= 70 THEN 'medium'
        WHEN confidence_score >= 1 THEN 'low'
        ELSE 'unknown'
    END AS confidence_band,
    CASE
        WHEN skills_detected IS NULL OR LOWER(skills_detected) = 'not detected in retained fields' THEN FALSE
        ELSE TRUE
    END AS has_detected_skills
FROM raw;

CREATE OR REPLACE VIEW public_demo.stg_public_skills AS
SELECT
    sample_row,
    snapshot_date,
    country,
    city,
    role_category,
    seniority,
    freshness_bucket,
    confidence_score,
    confidence_band,
    TRIM(skill_item.skill) AS skill
FROM public_demo.stg_public_sample,
UNNEST(STRING_SPLIT(COALESCE(skills_detected, ''), ';')) AS skill_item(skill)
WHERE TRIM(skill_item.skill) <> ''
  AND LOWER(TRIM(skill_item.skill)) <> 'not detected in retained fields';

CREATE OR REPLACE VIEW public_demo.vw_country_city_summary AS
SELECT
    snapshot_date,
    country,
    city,
    COUNT(*) AS sample_signal_count,
    COUNT(DISTINCT role_category) AS role_category_count,
    SUM(CASE WHEN has_detected_skills THEN 1 ELSE 0 END) AS skill_bearing_sample_count,
    SUM(CASE WHEN freshness_bucket = 'fresh_0_30_days' THEN 1 ELSE 0 END) AS fresh_sample_count,
    ROUND(100.0 * SUM(CASE WHEN freshness_bucket = 'fresh_0_30_days' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS fresh_sample_share,
    SUM(CASE WHEN salary_listed THEN 1 ELSE 0 END) AS salary_listed_count,
    ROUND(100.0 * SUM(CASE WHEN salary_listed THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS salary_coverage_pct,
    ROUND(AVG(confidence_score), 1) AS avg_confidence_score
FROM public_demo.stg_public_sample
GROUP BY snapshot_date, country, city;

CREATE OR REPLACE VIEW public_demo.vw_role_demand AS
WITH totals AS (
    SELECT
        snapshot_date,
        COUNT(*) AS total_sample_signals
    FROM public_demo.stg_public_sample
    GROUP BY snapshot_date
)
SELECT
    sample.snapshot_date,
    sample.role_category,
    COUNT(*) AS sample_signal_count,
    ROUND(100.0 * COUNT(*) / NULLIF(totals.total_sample_signals, 0), 1) AS sample_share,
    SUM(CASE WHEN sample.has_detected_skills THEN 1 ELSE 0 END) AS skill_bearing_sample_count,
    ROUND(AVG(sample.confidence_score), 1) AS avg_confidence_score,
    SUM(CASE WHEN sample.freshness_bucket = 'fresh_0_30_days' THEN 1 ELSE 0 END) AS fresh_sample_count
FROM public_demo.stg_public_sample AS sample
JOIN totals
  ON sample.snapshot_date = totals.snapshot_date
GROUP BY sample.snapshot_date, sample.role_category, totals.total_sample_signals;

CREATE OR REPLACE VIEW public_demo.vw_skill_demand AS
WITH totals AS (
    SELECT
        snapshot_date,
        COUNT(*) AS total_sample_signals
    FROM public_demo.stg_public_sample
    GROUP BY snapshot_date
)
SELECT
    skills.snapshot_date,
    skills.skill,
    COUNT(DISTINCT skills.sample_row) AS skill_mention_count,
    totals.total_sample_signals,
    ROUND(100.0 * COUNT(DISTINCT skills.sample_row) / NULLIF(totals.total_sample_signals, 0), 1) AS skill_demand_share,
    COUNT(DISTINCT skills.role_category) AS role_category_count,
    ROUND(AVG(skills.confidence_score), 1) AS avg_confidence_score
FROM public_demo.stg_public_skills AS skills
JOIN totals
  ON skills.snapshot_date = totals.snapshot_date
GROUP BY skills.snapshot_date, skills.skill, totals.total_sample_signals;

CREATE OR REPLACE VIEW public_demo.vw_freshness_quality AS
WITH totals AS (
    SELECT
        snapshot_date,
        COUNT(*) AS total_sample_signals
    FROM public_demo.stg_public_sample
    GROUP BY snapshot_date
)
SELECT
    sample.snapshot_date,
    sample.freshness_bucket,
    COUNT(*) AS sample_signal_count,
    ROUND(100.0 * COUNT(*) / NULLIF(totals.total_sample_signals, 0), 1) AS sample_share,
    ROUND(AVG(sample.confidence_score), 1) AS avg_confidence_score
FROM public_demo.stg_public_sample AS sample
JOIN totals
  ON sample.snapshot_date = totals.snapshot_date
GROUP BY sample.snapshot_date, sample.freshness_bucket, totals.total_sample_signals;

CREATE OR REPLACE VIEW public_demo.vw_confidence_metrics AS
SELECT
    snapshot_date,
    country,
    city,
    confidence_band,
    COUNT(*) AS sample_signal_count,
    ROUND(AVG(confidence_score), 1) AS avg_confidence_score,
    MIN(confidence_score) AS min_confidence_score,
    MAX(confidence_score) AS max_confidence_score
FROM public_demo.stg_public_sample
GROUP BY snapshot_date, country, city, confidence_band;

CREATE OR REPLACE VIEW public_demo.vw_sample_readiness AS
SELECT
    snapshot_date,
    COUNT(*) AS total_sample_rows,
    SUM(CASE WHEN country IS NULL THEN 1 ELSE 0 END) AS missing_country_count,
    SUM(CASE WHEN city IS NULL OR city = 'Unknown' THEN 1 ELSE 0 END) AS missing_or_unknown_city_count,
    SUM(CASE WHEN role_category IS NULL THEN 1 ELSE 0 END) AS missing_role_category_count,
    SUM(CASE WHEN NOT has_detected_skills THEN 1 ELSE 0 END) AS no_detected_skills_count,
    SUM(CASE WHEN freshness_bucket IS NULL OR freshness_bucket = 'unknown' THEN 1 ELSE 0 END) AS unknown_freshness_count,
    SUM(CASE WHEN salary_listed THEN 1 ELSE 0 END) AS salary_listed_count,
    ROUND(100.0 * SUM(CASE WHEN salary_listed THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS salary_coverage_pct,
    ROUND(AVG(confidence_score), 1) AS avg_confidence_score,
    'public_safe_anonymized_sample' AS sample_scope,
    'Demonstrates schema, metric logic, dashboard views, and privacy-safe reporting patterns; not a full-market estimate.' AS scope_note
FROM public_demo.stg_public_sample
GROUP BY snapshot_date;

# GCC Analyst Market Tracker Dashboard Requirements

## Dashboard Objective

Help product and business stakeholders monitor regional analyst-role demand, priority markets, skill trends, recommendation coverage, and data-quality risk across GCC countries.

The dashboard should support weekly insight planning using reviewed, deduplicated, aggregate-only market signals.

## Stakeholders

- Product/business stakeholder: uses country, city, role, and skill trends to prioritize weekly insight topics and market coverage.
- Data stakeholder: monitors refresh status, validation checks, schema consistency, completeness, and source confidence.
- Analyst/user: reviews weekly market insights and skill recommendations to decide which roles, cities, and skills to investigate.
- Public/compliance reviewer: checks that public outputs remain aggregate or anonymized and do not expose raw postings, recruiter contact details, application links, or private provider data.

## Key Business Questions

- Which GCC countries and cities show the strongest analyst-role demand signals?
- Which analyst role types appear most often in the reviewed sample?
- Which skills are most frequently requested by role, country, and city?
- Which role-market combinations have enough signal quality to support recommendations?
- What changed since the previous weekly snapshot?
- Where are reporting gaps, stale records, duplicate risks, or classification issues appearing?
- Are public-facing outputs safe to share without exposing private or restricted fields?

## Requirements Matrix

| Stakeholder | Business Question | Dashboard View | Metric / KPI | Filters | Refresh Cadence | Data-Quality Check |
|---|---|---|---|---|---|---|
| Product/business stakeholder | Which GCC countries and cities show the strongest analyst-role demand? | Regional Overview; Country/City Trends | Role Signal Count; New Signals Since Previous Scan | Country, city, role type, refresh date | Weekly | Deduplicate records and confirm country/city fields are populated before publishing location views. |
| Product/business stakeholder | Which insight topics should be prioritized this week? | Regional Overview | Role mix, fresh unique jobs, confidence score | Country, city, role type, confidence band, refresh date | Weekly | Confirm the derived dashboard package reflects the latest approved refresh. |
| Product/business stakeholder | Which skills are most frequently requested by role and country? | Skill Demand | Skill Mention Count; Skill Demand Share | Country, city, role type, skill cluster, refresh date | Weekly | Validate skill taxonomy mapping and flag low-sample slices before using them as recommendations. |
| Data stakeholder | Which role-market combinations have enough quality to support recommendations? | Recommendation Priorities | Recommendation Coverage; High/Medium Confidence Share | Country, city, role type, confidence band, refresh date | Weekly | Check for missing recommendation rows and mark low-confidence or low-sample combinations. |
| Data stakeholder | Where are reporting gaps or source-quality issues appearing? | Data Quality Monitor | Required Field Completion; Duplicate Flag Rate; Data Freshness % | Source type, country, city, role type, refresh date | Weekly | Flag missing country, city, role classification, skill count, posting date, and duplicate-review fields. |
| Analyst/user | Which role, city, or skill path should be investigated next? | Recommendation Priorities; Skill Demand | Top Skills by Role; Recommendation Coverage; Confidence Score | Country, city, role type, skill cluster, confidence band | Weekly | Qualify recommendations when confidence is low or the underlying sample is small. |
| Public/compliance reviewer | Are public-facing outputs safe to share? | Data Quality Monitor; Public Readiness Check | Public-Safe Output Compliance | Output type, refresh date | Before each public share | Verify public files exclude raw listings, full descriptions, company/source details where restricted, recruiter contacts, direct application links, and private provider fields. |

## Core Metrics

| Metric | Definition | Formula / Logic | Refresh | Quality Check | Limitation |
|---|---|---|---|---|---|
| Role Signal Count | Count of valid reviewed analyst-role records retained for aggregate analysis. | Count reviewed records after relevance screening and deduplication. | Weekly | Remove duplicates and exclude records outside the analyst-role scope. | Directional sample |
| New Signals Since Previous Scan | Count of reviewed roles newly observed since the previous comparable scan. | Current refresh records not present in the previous comparable scan. | Weekly | Compare only against the same scope, countries, role set, and source rules. | Should be described as newly observed signals, not exact market growth. |
| Skill Mention Count | Count of reviewed records where a tracked skill appears. | Count records mapped to each skill in the taxonomy. | Weekly | Validate skill mapping and avoid double-counting repeated mentions within one record. | Skill mentions do not prove required proficiency level. |
| Skill Demand Share | Share of valid roles mentioning a skill within the selected slice. | Skill mention count / total valid role signals in selected slice. | Weekly | Check that the denominator reflects the active country, city, role, and date filters. | Small slices can exaggerate apparent demand. |
| Data Freshness % | Share of reviewed records inside the target freshness window. | Records inside freshness window / records with usable freshness data. | Weekly | Flag missing or stale posting-date fields. | Provider date fields may be incomplete or inconsistent. |
| Confidence Score | Reliability indicator based on source quality, classification confidence, and completeness. | Project scoring heuristic from reviewed source and classification fields. | Weekly | Flag low-confidence rows and slices before publishing recommendations. | Confidence is a project heuristic and not an external standard. |
| Recommendation Coverage | Coverage of generated skill recommendations by role and market. | Recommendation rows or covered role-market combinations / expected priority combinations. | Weekly | Check missing recommendation rows and low-confidence recommendations. | Coverage does not guarantee recommendation quality. |
| Required Field Completion | Share of required reporting fields populated across reviewed records. | Filled required cells / total required cells. | Weekly | Track missing country, city, role type, skill count, freshness, validation level, and confidence fields. | A high cell-completion rate can still hide row-level gaps. |
| Duplicate Flag Rate | Share of reviewed source rows flagged as possible duplicates. | Duplicate-flagged rows / reviewed rows by source. | Weekly | Review high-duplicate sources before aggregate publishing. | High rates may reflect reposting or source behavior, not only pipeline problems. |
| Public-Safe Output Compliance | Whether public outputs avoid restricted or private fields. | Restricted-field hits in public outputs should equal zero. | Before public share | Inspect public sample columns and spot-check content before sharing. | Header checks should be paired with content checks. |

## Filters

- Country
- City
- Role type
- Skill cluster
- Source type
- Confidence band
- Freshness bucket
- Refresh date or snapshot date
- Public/private output type

## Data Quality Rules

- Deduplicate records by title, role, location, source, posting date, and available identifier fields.
- Flag missing country, city, skill count, role classification, posting date, validation level, or confidence score.
- Flag stale records outside the target refresh window.
- Separate public sample data from private reviewed data.
- Keep public views aggregate-only unless a row-level sample has been explicitly anonymized.
- Track recommendation coverage and invalid or low-confidence classification rates.
- Label small-sample slices clearly before using them for business recommendations.
- Rebuild derived dashboard outputs before publishing weekly insight updates.

## Dashboard Views

1. Regional Overview: shows current market-read size, latest refresh status, top countries/cities, and high-level role mix.
2. Country/City Trends: compares demand signals across GCC countries and priority cities over time.
3. Skill Demand: shows top skills by role, country, city, and skill cluster.
4. Recommendation Priorities: highlights role-market combinations with enough signal quality to support skill recommendations.
5. Data Quality Monitor: surfaces freshness, duplicate risk, required-field completion, confidence, and public-safe output checks.

## Refresh Cadence

- Weekly: refresh reviewed records, aggregate dashboard files, trend snapshots, skill demand views, recommendation coverage, and data-quality metrics.
- Before public sharing: run public-safe output checks against sample files, screenshots, and public documentation.
- Monthly: review KPI definitions, stakeholder questions, methodology language, and any changes to source or classification rules.

## Acceptance Criteria

- Dashboard supports filtering by country, city, role type, skill cluster, confidence band, and refresh date.
- Core metrics have plain-language definitions and visible limitations.
- Weekly refresh status is visible before insights are published.
- Data-quality issues are visible before business recommendations are made.
- Small-sample or low-confidence findings are clearly qualified.
- Public-facing outputs exclude raw postings, full job descriptions, recruiter contacts, direct application links, and private provider fields.
- Non-technical stakeholders can understand priority markets, role demand, skill trends, and recommendation readiness without reading the pipeline code.

---
name: objective-score
description: Scores all task prompts in a Vesta objective folder and produces a concise executive-level health report. Reads every .md file in the objective's tasks/ subfolder, scores each against the 13 prompt-score dimensions, calculates an Objective Health Score (OHS%), and writes a markdown report to Vesta/reports/. Use when the user says "objective-score", "score this objective", "audit this objective", "run objective score", or names a Vesta objective and wants a quality report. Does not fix or rewrite anything — read-only audit only.
disable-model-invocation: true
---

# Objective Score

Read-only audit skill. Scores all task prompts in a Vesta objective, aggregates results, and writes a concise executive health report.

---

## On Invocation

Read and follow: `../prompt-score/SKILL.md`

Then ask the user (if not already provided):

> What is the objective name? (e.g., `agent-funding-review`, `agent-loan-set-up`)

---

## Step 1 — Locate the objective

Find an exact folder match at:

```
Vesta/config/objectives/{objective-name}/tasks/
```

If the folder does not exist, stop and tell the user:

> No objective named `{name}` was found in `Vesta/config/objectives/`. Please check the name and try again.

---

## Step 2 — Collect task files

List all `.md` files inside `tasks/`. Skip any file named `README.md`.

If no `.md` files are found, stop and report:

> No task files found in `{objective-name}/tasks/`.

Record: `N = number of task files`

---

## Step 3 — Score each task

For each task file, run a full `prompt-score` evaluation across all 13 dimensions (R1–R7, M1–M6). Record:

- Task file name (slug, without `.md`)
- Score per dimension (13 values, each 0–10)
- Raw score = sum of 13 dimension scores (max 130)

Do not render individual scorecards — collect all results silently before generating the report.

---

## Step 4 — Calculate objective metrics

### Objective Health Score (OHS%)

```
OHS% = (sum of all dimension scores across all N tasks) / (130 × N) × 100
```

Round to one decimal place.

### Production-Ready Rate

```
Production-Ready = count of tasks where raw score / 130 ≥ 0.90
Production-Ready Rate = (Production-Ready count / N) × 100%
```

### Risk Tier

| OHS%      | Risk Tier         |
|-----------|-------------------|
| 90–100%   | ✅ Healthy         |
| 75–89%    | ⚠️ Needs Attention |
| < 75%     | ❌ At Risk         |

### Dimension Averages

For each of the 13 dimensions, calculate the average score across all N tasks. Identify the 3 dimensions with the lowest average — these are the Top Issues.

---

## Step 5 — Write the report

Create the `Vesta/reports/` directory if it does not exist.

Save the report to: `Vesta/reports/{objective-name}-score-report.md`

Use this exact template:

```markdown
# Objective Score Report: {Objective Display Name}

**Generated:** {YYYY-MM-DD} | **Tasks Audited:** {N} | **Health Score:** {OHS%}% | **Risk:** {Risk Tier}

---

## Executive Summary

{2–3 sentences for upper management. State the overall health, the single biggest systemic issue if OHS% < 90, and whether the objective is production-ready. Be direct and non-technical.}

---

## Metrics at a Glance

| Metric | Value |
|--------|-------|
| Objective Health Score | {OHS%}% |
| Production-Ready Tasks | {count} / {N} ({rate}%) |
| Average Task Score | {avg} / 130 |
| Risk Level | {tier} |
| Weakest Dimension | {bottom dimension name} |

---

## Dimension Health

| Dimension | Avg Score | Status |
|-----------|-----------|--------|
| {dimension} | {X.X} / 10 | {✅ ≥ 9 · ⚠️ 7–8 · ❌ < 7} |

*Sorted lowest to highest.*

---

## Task Breakdown

| Task | Score | Status |
|------|-------|--------|
| {task-slug} | {raw} / 130 | {✅ ≥ 117 · ⚠️ 91–116 · ❌ ≤ 90} |

---

## Top Issues

{3–5 bullet points. Each is one sentence. Cite the dimension and which task(s) are affected. Lead with patterns that appear across multiple tasks.}
```

After writing the file, confirm to the user:

> Report saved to `Vesta/reports/{objective-name}-score-report.md`

---

## Referenced Skills

- Scoring: `../prompt-score/SKILL.md`

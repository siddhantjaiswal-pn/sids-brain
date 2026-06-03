---
name: prompt-qa
description: Read-only QA agent for a single Vesta agent task prompt. Treats the prompt as a deterministic decision tree, extracts its input variables and branches, generates test scenarios and cases (branch + boundary coverage), statically traces each case to its terminal, measures coverage, and flags logic defects and gaps (unhandled inputs, contradictions, dead logic, ambiguous boundaries). Writes a QA report to factory-output/prompt-qa/. Never calls a live API and never edits the prompt — it reports and recommends only. Use when the user says "prompt qa", "qa this prompt", "test this prompt", "generate test cases", "what scenarios does this prompt cover", "coverage for this prompt", or runs Line D of Prompt Factory v2.
disable-model-invocation: false
---

# Prompt QA

Read-only QA agent for a **single** Vesta agent task prompt. It treats the prompt as a deterministic decision tree, generates test cases, statically traces them, measures coverage, and reports logic defects and gaps. It is the **Line D** entry point of Prompt Factory v2.

**Design principles (read first):**
1. **Static trace only.** Never call a live API, never run the real Vesta agent, never create a loan. All "execution" is the QA agent reasoning through the prompt's logic deterministically.
2. **Read-only.** Never edit, rewrite, or save changes to the prompt under test. The only file this skill writes is its own QA report. Recommended fixes are listed in the report, not applied.
3. **Single prompt.** Scope is exactly one task prompt per run. No batch/objective-wide auditing here.
4. **Flag, never ask, never invent.** When a scenario has no defined outcome, an input class is unhandled, or business intent is ambiguous, record it as a flagged gap in the report. Do not ask the user to resolve it and do not assume what the outcome should be.
5. **Reference, never paraphrase the writing rules.** Style/structure rules live in `../prompt-score/SKILL.md`. Prompt QA evaluates *logical completeness and correctness*, not writing style.
6. **External actions can fail.** Treat every write/action step — `Set [field] to [value]`, `Order [service]`, `Run [integration]`, `Mark the [...] document as Accepted`, etc. — as **fallible**. The platform agent performs these externally, so they can fail at runtime (write failure, timeout, downstream error) even when the surrounding logic is correct. A branch that guards against a failed action (a post-action failure catch-all and the escalation it leads to) is a **correct safeguard, never "dead code"** — even when the preceding logical branches are exhaustive. Static trace cannot simulate an external failure, so classify such branches as *external-failure guards* (verified present) and exclude them from the logic-branch denominator rather than counting them as unreachable or missing.
7. **Readable references.** Whenever you cite a branch anywhere in the report, describe it in plain language tied to its step — e.g., `STEP 4 · "adjusted = today & after cutoff"`. Never use opaque internal codes (e.g., "B4e") in user-facing output. You may use short internal IDs while reasoning, but they must not appear in the report.
8. **Standardized output.** Every report MUST follow the **Report Template** exactly — the same sections, in the same order, with the same headings, the same table columns, and the same row order. Do not add, remove, rename, merge, or reorder sections or columns. Always include every fixed row, even when its value is `0` or `N/A`. Format every coverage metric the same way — `count/total (percent%)` with the percent rounded to a whole number. The goal is that two runs on different prompts produce reports that look identical in shape.

### Relationship to `prompt-score`

These are complementary. `prompt-score` answers "is the prompt **written** correctly?" (rules R1–R7, M1–M6). Prompt QA answers "is the prompt **logically complete and correct** across every input scenario?" A prompt can pass `prompt-score` and still fail QA (e.g., an input value that no branch handles).

---

## Question Formatting Rule

If this skill ever needs to present options to the user, **always use numbered lists (1, 2, 3)** — never bullets or lettered lists. (In normal operation this skill flags gaps in the report instead of asking questions.)

---

## Workflow

### Step 1 — Locate and read the prompt

- If the user provides a `.md` path, use it.
- If no path is given, ask: "Please provide the path to the prompt file you want to QA."

Read the full file. Identify every labeled `STEP`, every `IF` / `IF NOT` branch, every data read, every field write, and every terminal (`finish with status=completed`, each `Escalate ... with the reason '...'`, and `Do not complete the task.`).

### Step 2 — Build the input variable model

List every input the prompt reads, and break each into its **equivalence classes** (the distinct value-ranges the logic treats differently), plus an explicit **"undetermined / unavailable"** class for anything fetched at runtime.

Input types to capture:
- Loan data fields (every `search_loan_data_model` / referenced field).
- Documents (presence/absence, accepted/not).
- Environmental inputs (current date, current time, day-of-week, holidays).
- Derived/computed values the prompt itself sets (treat as intermediate variables).

Example (from a date/cutoff prompt): `Mortgage Size {Jumbo | non-Jumbo | undetermined}`, `Median Credit Score {<550 | ≥550 | undetermined}`, `Scheduled Disbursement Date {undetermined | past | today | future}`, `candidate day {business day | weekend | holiday}`, `current time vs cutoff {before | at | after}`.

### Step 3 — Map the branch graph

Trace the step-to-step flow. For each branch, record:
- The condition, described in **plain language tied to its step** (principle 7) — never an opaque code in any output.
- The action/outcome (which terminal it leads to, or the next step).
- Whether the negative case is handled.
- Its **branch type**:
  - **Logic branch** — fires based on input values / data conditions. These are statically exercisable and form the logic-branch coverage denominator.
  - **External-failure guard** — fires only if a write/action step fails at runtime (e.g., "IF Funds Ordered Date cannot be set for any reason…"). Per principle 6, these are correct safeguards, not dead code; they are not statically exercisable and are excluded from the logic-branch denominator.

### Step 4 — Generate test scenarios and cases

For each test case record `{inputs → expected outcome}` and the branch(es) it exercises. Generate:
1. **Branch cases** — at least one case that makes each `IF` and each `IF NOT` fire.
2. **Boundary cases** — edge values at every threshold (e.g., score exactly 550, time exactly at cutoff, the literal holiday dates, leap day, today vs. yesterday vs. tomorrow).
3. **Undetermined-input cases** — one case per fetched input being unavailable.

The **expected outcome** is what the prompt *says* should happen. If the prompt defines nothing for that combination, mark the expected outcome as `UNDEFINED` (this becomes a gap in Step 7).

### Step 5 — Execute via static trace

For each case, walk the prompt deterministically from the first step, following the branches the inputs satisfy, and record the **traced outcome** (the terminal actually reached, or `FALLS THROUGH` if no branch matches).

Per-case status:
- **PASS** — traced outcome is well-defined and matches a single intended terminal.
- **GAP** — no branch matches the inputs (fall-through) or the expected outcome is `UNDEFINED`.
- **AMBIGUOUS** — more than one branch matches (non-deterministic), or a boundary is under-specified.
- **GUARD** — the case probes an external-action failure (e.g., a write/action step fails). Confirm the prompt has a correct failure guard and terminal; mark it verified-present. This is not a defect and does not count against logic-branch coverage.

### Step 6 — Measure coverage

Compute each metric below. Always express it as `count/total (percent%)`, percent rounded to a whole number. These map one-to-one onto the fixed rows in the **Coverage at a Glance** table — report all of them every time, even when a value is `0`.

- **Logic branch coverage** = logic branches exercised / total **logic** branches. Exclude external-failure guards from both numerator and denominator (per principle 6).
- **Outcome coverage** = distinct terminals reached / total terminals defined.
- **Input-class coverage** = input classes exercised / total classes (including "undetermined").
- **Boundary coverage** = boundary cases that resolve to a single defined outcome / total boundary cases.
- **External-failure guards** = report the count and confirm each has a correct terminal (e.g., "2 present and correct"). These are not a percentage and are excluded from logic branch coverage.

Also tally the per-case status counts (Passed / Gaps / Ambiguous / Action-failure guards) from Step 5 — these populate the scorecard rows.

### Step 7 — Detect defects

Run the defect taxonomy against the model and traces. Record each finding with its code, the step(s) involved, quoted text, and a severity (High / Medium / Low).

| Code | Defect | What it means |
|------|--------|---------------|
| Q1 | **Unhandled input** | An input class (often "undetermined / unavailable") that no branch covers. |
| Q2 | **Gap / fall-through** | A value combination satisfies no `IF` and there is no catch-all. |
| Q3 | **Contradiction / overlap** | Two branches can be true for the same inputs → non-deterministic. |
| Q4 | **Dead / unreachable branch** | A *logic* branch that no input combination can trigger. **Do not flag external-failure guards here** (per principle 6) — a post-action failure catch-all is a correct safeguard even when the preceding logic branches are exhaustive. Only flag genuinely dead logic. |
| Q5 | **Dead computation** | A value is set/derived but never used by any downstream branch or terminal. |
| Q6 | **Ambiguous boundary** | Inconsistent edge handling (e.g., "before" vs "at or before") leaving an edge value undefined or double-defined. |
| Q7 | **Undefined reference** | A field or document is used in a branch but never fetched/established earlier. |
| Q8 | **Non-deterministic outcome** | One scenario can legitimately reach two different terminals. |

Per principle 4, business-intent gaps (e.g., "ineligible loans are computed but never handled") are **flagged**, not resolved.

### Step 8 — Write the report

Create `factory-output/prompt-qa/` in the workspace root if it does not exist. Never write inside any `.cursor/` directory.

Save the report to:

```
factory-output/prompt-qa/{task-name}-qa-report.md
```

where `{task-name}` is the prompt file name without `.md` (e.g., `review-wire-sweep-time`).

Use the **Report Template** below. After writing, confirm to the user:

> QA report saved to `factory-output/prompt-qa/{task-name}-qa-report.md`

Do not modify the prompt under test. If the user wants the recommendations applied, point them to **Line B (Fix)** of Prompt Factory v2.

---

## Report Template

Reproduce this template **exactly** (per principle 8): same sections, same order, same headings, same table columns, same row order. Fill in the `{...}` placeholders only — never alter the surrounding labels, column headers, or the "What this measures" text. Keep every fixed row even when its value is `0` or `N/A`.

```markdown
# Prompt QA Report: {Task Display Name}

**Prompt:** `{relative path to prompt}`
**Generated:** {YYYY-MM-DD}
**Logic Branch Coverage:** {covered}/{total} ({X}%) | **Outcome Coverage:** {covered}/{total} ({X}%) | **Defects:** {High}/{Med}/{Low} (H/M/L)
*(+{n} external-action failure guards present and correct — not exercisable by static trace.)*

---

## Summary

{2–3 sentences: overall logical health, the single biggest gap, and whether the prompt handles all input scenarios deterministically. If external-failure guards are present, note they are intentional safeguards, not defects. Non-technical.}

---

## Coverage at a Glance

**Bottom line:** {one plain-language sentence — how complete and correct the prompt's logic is, and whether anything needs attention.}

**How the test cases turned out:**

| Result | Count | What this means |
|--------|-------|-----------------|
| Cases tested | {N} | Total scenarios traced through the prompt's logic |
| Passed | {a} | Reached one clear, correct outcome |
| Gaps | {b} | Hit a situation the prompt doesn't define an answer for |
| Ambiguous | {c} | Could reach more than one outcome — the prompt isn't decisive |
| Action-failure guards | {d} | Probed a write/action failure (see note below) |

**How much of the prompt the tests covered:**

| Coverage | Score | What this measures |
|----------|-------|--------------------|
| Decision branches | {covered}/{total} ({X}%) | Of every IF / IF NOT path, how many a test exercised |
| Outcomes | {covered}/{total} ({X}%) | Of every possible ending (complete / escalate / etc.), how many were reached |
| Input types | {covered}/{total} ({X}%) | Of every input value-class (including "unavailable"), how many were tested |
| Edge cases | {covered}/{total} ({X}%) | Of every threshold/boundary value, how many resolved to one clear outcome |

**Action-failure guards:** {n} present and correct (a write/action the platform performs externally can fail at runtime; a correct guard is not testable by static trace and is excluded from the decision-branch score above — it is not a missing branch). *If a guard is missing instead of present, say so here and note it is counted as a defect below.*

---

## Input Variable Model

| Variable | Source | Equivalence classes |
|----------|--------|---------------------|
| {name} | {loan data / document / environment / derived} | {class A · class B · undetermined} |

---

## Test Cases

In "Traced outcome," reference branches in plain language tied to their step (e.g., `STEP 4 "adjusted = today & after cutoff"`) — never opaque codes.

| # | Scenario (key inputs) | Expected outcome | Traced outcome | Status |
|---|-----------------------|------------------|----------------|--------|
| 1 | {inputs} | {terminal or UNDEFINED} | {terminal or FALLS THROUGH} | {PASS / GAP / AMBIGUOUS / GUARD} |

---

## Branch Coverage Matrix

Describe every branch in plain language, grouped under its step. Never use opaque branch codes. Mark external-failure guards explicitly so they are not mistaken for gaps.

### {STEP N — step name}

| Branch (plain language) | Exercised by case(s) | Negative case handled? |
|-------------------------|----------------------|------------------------|
| {plain-language condition → outcome} | {#, #} | {yes / no / external-failure guard — correct to keep} |

---

## Defects & Gaps

| Code | Severity | Step | Finding |
|------|----------|------|---------|
| {Q1} | {High} | {STEP N} | "{quoted text}" — {one-line explanation} |

*If none: "No defects or gaps found."*

---

## Recommended Enhancements

{Numbered list. Each ties to a defect code and names the concrete logic to add (e.g., "Add a branch in STEP 2 for when Median Credit Score is undetermined"). Do not specify the business outcome where intent is unknown — state that the decision is needed. For any external-failure guard, add a "Keep as-is" line affirming it is a correct safeguard. To apply any of these, run Line B (Fix) of Prompt Factory v2.}
```

---

## Referenced Skills

- Writing rules (for context only; QA does not score style): `../prompt-score/SKILL.md`
- Document type names: `../prompt-score/vesta-doc-types.md`
- Manager / line router: `../prompt-factory-v2/SKILL.md`
- Apply recommended fixes (separate, explicit step): Line B of `../prompt-factory-v2/SKILL.md`

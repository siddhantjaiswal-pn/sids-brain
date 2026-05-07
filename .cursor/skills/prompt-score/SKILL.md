---
name: prompt-score
description: >-
  Scores a Vesta agent task prompt (.md file) across 12 dimensions derived from
  the Vesta Agent Task Instruction Writing Guide guardrails (R1–R7, M1–M5).
  Produces a scorecard table with per-dimension rationale and a flagged issues
  list. Use when the user says "prompt-score", "score this prompt", "grade this
  task", "rate my prompt", or provides a .md path and asks for a quality score.
---

# Prompt Score

Scores a Vesta agent task prompt across **12 guardrail dimensions** on a **0–10 scale**.

---

## Scoring Dimensions

| # | Dimension | What is evaluated |
|---|-----------|-------------------|
| R1 | Self-contained | No step assumes knowledge from a prior task — all needed data is looked up directly |
| R2 | Explicit actions | Every step names the exact action, tool, field, or document — no implied actions |
| R3 | If/Then logic | Every conditional has specific criteria and a named outcome for each branch — no unhandled branches |
| R4 | Explicit escalation | Every failure or gap case includes a trigger condition and a stated reason for escalation |
| R5 | Data source specified | Loan data fields and uploaded documents are always distinguished — never conflated |
| R6 | Completion defined | Every path ends with a clear `status=completed`, an escalation, or an explicit `Do not complete the task.` instruction (always preceded by a `Write a note stating [reason]`) — no dangling paths |
| R7 | No UI references | No step references screens, buttons, dropdowns, or navigation — rewritten as data lookups |
| M1 | No cross-task references | No step references what another task found or decided |
| M2 | No vague instructions | No open-ended language like "make sure", "review the loan", or "ensure it's correct" |
| M3 | Escalation path exists | All situations the agent cannot resolve have an explicit escalation — not left to "unable to complete" |
| M4 | No human communication | No instruction to email, call, notify, or contact any person |
| M5 | Documents named explicitly | All document references use the full type name (e.g., "credit report", "bank statements") |

---

## Per-Dimension Scale

| Score | Meaning |
|-------|---------|
| 10 | Fully satisfied — no issues found |
| 7–9 | Minor gap — mostly compliant, one small issue |
| 4–6 | Partial — notable violations, multiple steps affected |
| 1–3 | Major violations — rule largely unmet |
| 0 | Absent — rule completely unaddressed |

---

## Workflow

### Step 1 — Locate the file

- If the user provides a `.md` path, use it.
- If no path is given, ask: "Please provide the path to the prompt file you want scored."

### Step 2 — Read the file

Read the full contents. Note labeled steps, conditional logic, escalation paths, and completion states.

### Step 3 — Score each dimension

For each of the 12 dimensions, assign a score 0–10 with a one-line rationale. Cite the specific step and quote offending text for any score below 7.

### Step 4 — Render the scorecard

Output in this exact format:

```
File: {relative path}

--- Prompt Score ---

| Dimension                  | Score | Rationale                                      |
|----------------------------|-------|------------------------------------------------|
| R1  Self-contained         |  /10  |                                                |
| R2  Explicit actions       |  /10  |                                                |
| R3  If/Then logic          |  /10  |                                                |
| R4  Explicit escalation    |  /10  |                                                |
| R5  Data source specified  |  /10  |                                                |
| R6  Completion defined     |  /10  |                                                |
| R7  No UI references       |  /10  |                                                |
| M1  No cross-task refs     |  /10  |                                                |
| M2  No vague instructions  |  /10  |                                                |
| M3  Escalation path        |  /10  |                                                |
| M4  No human comms         |  /10  |                                                |
| M5  Documents named        |  /10  |                                                |

Overall: XX / 120

--- Flagged Issues ---
[R3] Step N — "{quoted text}" — unhandled branch, no negative case defined.
[M2] Step N — "{quoted text}" — vague, no specific field or criteria named.
[R7] Step N — "{quoted text}" — references a UI element; rewrite as a data lookup.
```

If no issues, replace the Flagged Issues section with: `No issues found.`

### Step 5 — Offer next steps

After the scorecard, always offer:

> - Say **"fix"** to apply corrections to all flagged issues.
> - Say **"guardrails"** to run the full pass/fail audit instead.
> - Or tell me which specific steps to update.

Do NOT apply fixes unless the user says "fix."

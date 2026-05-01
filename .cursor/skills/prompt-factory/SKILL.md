---
name: prompt-factory
description: >-
  Orchestrates the full Vesta prompt lifecycle for a single task: takes a
  detailed workflow description, writes Checklist Steps using Prompt Designer
  rules and 10 internal quality checks, scores across 10 dimensions, rewrites
  to fix all flagged issues, and saves the final prompt to output-prompts/.
  Use when the user says "prompt factory", "run prompt factory", "create a
  prompt", "generate a prompt for [task]", "score and rewrite this prompt",
  "fix this prompt", or provides a task description and wants a production-ready
  Vesta agent task prompt.
---

# Sid's Prompt Factory

When this skill is invoked, print this banner first before doing anything else:

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              ✦  Sid's Prompt Factory  ✦                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Mode Selection

Immediately after the banner, ask:

> "Are we creating a **new** prompt or improving an **existing** one?"

- If **new** → follow [New Prompt Mode](#new-prompt-mode)
- If **existing** → follow [Existing Prompt Mode](#existing-prompt-mode)

---

## New Prompt Mode

### Step 1 — Gather workflow description

Ask the user for one thing only:

> "Describe the full workflow for this task in as much detail as you can — what the agent should do, any branching conditions, calculations, escalation triggers, and what success looks like."

Do NOT ask any follow-up questions. Use the description as the sole input.

### Step 2 — Write Checklist Steps

Use the workflow description to write the Checklist Steps. Apply every internal quality check below silently — do not ask the user about them:

**Internal quality checklist (never surface these as questions):**

1. Is the task self-contained? Rewrite any step that references what a previous task found — replace with an explicit runtime lookup.
2. Are all actions explicit? Every step must name the exact tool, field, or document.
3. Does any step involve contacting a person? Reframe as: gather data → escalate to human.
4. Are there branching conditions? Every `If [condition]` must have a matching `else` or `else if`. No unhandled paths.
5. Are there calculations? Apply the calculation step pattern (Goal, Constraints, Calculation Instructions, fallback escalation).
6. Is escalation explicit? Every failure path must include `Escalate the objective with the reason '[reason]'`.
7. Does every path terminate? Every branch must end in Complete or Escalate. No dead ends.
8. Does the success path call `Use finish with status=completed` verbatim?
9. Are data sources distinguished? Loan data reads use `Use search_loan_data_model`. Document reads use `Review the [document]` or `Get the [document]`. Never conflate.
10. Does the task avoid cross-task memory? No step may reference what another task decided.

**Formatting rules:**
- Number every top-level step: `**1.**`, `**2.**`, etc.
- Use ALL CAPS for named sub-sections within a step (e.g., `GATHER KEY DATES`).
- Write conditional logic as: `If [condition] => [action]` or `If [condition] then [action]`.
- Use `else if` chains for multi-branch conditions — never leave a branch unhandled.
- Every path must terminate in Complete or Escalate.

**Calculation step pattern:**
```
**N.** CALCULATE [THING]

Goal: [one-sentence goal]

Constraints:
1. [Constraint 1]
2. [Constraint 2]

Calculation Instructions:
- [Formula or approach]
- [Rounding rule if applicable]
- If no valid value exists within all constraints => Escalate the objective with the reason '[reason]'.
```

**Action vocabulary — use these exact phrasings:**

| Action | Phrasing |
|--------|----------|
| Write a loan field | `Set [field] to [value]` |
| Leave a note | `Write a note stating [message]` |
| Escalate | `Escalate the objective with the reason '[reason]'` |
| Block | `Block the objective for [duration/condition]` |
| Review a document | `Review the [document type]` or `Get the [document]` |
| Run validations | `Run get_loan_validations and check for [specific validations]` |
| Call an integration | `Order [service]` or `Run [integration name]` |
| Make a UW decision | `Set loan decision to [decision]` |
| Read loan data | `Use search_loan_data_model to get [field/entity]` |
| List objectives | `Use list_objectives to find [objective name]` |
| Complete the task | `Use finish with status=completed` |

### Step 3 — Confirm before scoring

Show the full drafted steps. Ask:

> "Does this look right? Confirm to proceed to scoring, or tell me what to change."

Apply any requested changes and re-show before proceeding. Do NOT enter the scoring loop until confirmed.

---

## Existing Prompt Mode

### Step 1 — Read the file

Read the `.md` file the user points to.

### Step 2 — Run initial QC scan

Before asking the user anything, score the prompt across all 10 dimensions using the full scoring rubric from the [Score Phase](#score-phase). Print the full scorecard and flagged issues list.

Then present a summary:

> "**Initial QC scan complete.**
>
> Score: **X.X / 10**
>
> [scorecard table]
>
> [flagged issues list]
>
> Want me to improve this prompt?"

Do NOT ask what needs to change yet. Do NOT make any edits. Wait for the user's answer.

- If the user says **no** → stop. Do not proceed.
- If the user says **yes** → continue to Step 3.

### Step 3 — Ask what needs to change

> "What should change? Tell me which steps to update, new rules to add, or edge cases to handle — or say 'fix all flagged issues' to address everything from the QC scan."

Do NOT make changes until answered. If a new constraint conflicts with an existing one, flag it and ask which takes precedence.

### Step 4 — Apply updates

Apply the same formatting rules, action vocabulary, and internal quality checklist from [New Prompt Mode — Step 2](#step-2--write-checklist-steps).

Show the full updated steps. Ask for confirmation before proceeding to scoring.

---

## Score Phase

After confirmed steps, score the prompt across all 10 dimensions using the rubric below. Run this internally — produce the scorecard and flagged issues list in chat.

### Scoring Rubric

**1. Specificity** — Does every step name exact field names, document types, and values?
- 10: Every field, document, and value is named explicitly. 5–9: Most explicit; a few vague references. 1–4: Multiple vague steps. 0: Entirely vague.

**2. Clarity** — Does each step answer: what to check, what to look for, what to do with the result?
- 10: Every step has all three. 5–9: Most clear; one or two outcomes undefined. 1–4: Several steps ambiguous. 0: Unclear throughout.

**3. Conciseness** — Is each step free of padding, repetition, and prose explanations?
- 10: Tight, action-focused. 5–9: Minor repetition. 1–4: Noticeable padding. 0: Bloated throughout.

**4. Branch completeness** — Does every `If [condition]` have a matching `else` or `else if`?
- 10: Every branch handled. 5–9: One or two missing. 1–4: Multiple missing. 0: No else handling.

**5. Path termination** — Does every branch end in Complete or Escalate?
- 10: Every branch terminates. 5–9: One trails off. 1–4: Several have no terminal. 0: Most have no terminal.

**6. Explicit completion call** — Does the success path contain `Use finish with status=completed` verbatim?
- 10: Present verbatim. 5: Paraphrased. 0: Absent.

**7. Self-containment** — Does any step reference what a previous task found?
- 10: No cross-task references. 5–9: One ambiguous. 1–4: One or more explicit cross-task refs. 0: Multiple.

**8. Action vocabulary** — Does the prompt use canonical action phrasings?
- 10: All canonical. 5–9: Mostly canonical; one or two informal. 1–4: Several non-standard. 0: None canonical.

**9. Escalation coverage** — Does every failure condition route to `Escalate the objective with the reason '[reason]'`?
- 10: Every failure path has explicit escalation with reason. 5–9: Most covered; one missing reason. 1–4: Some paths missing. 0: No explicit escalation.

**10. Data source distinction** — Are loan data reads and document reviews kept distinct?
- 10: Every access explicitly names the source. 5–9: Mostly clear; one ambiguous. 1–4: Multiple conflated. 0: Source never specified.

### Scorecard output format

```
## Prompt Scorecard

| #  | Dimension               | Score | Notes                          |
|----|-------------------------|-------|--------------------------------|
| 1  | Specificity             |  ?/10 | {one-sentence rationale}       |
| 2  | Clarity                 |  ?/10 | {one-sentence rationale}       |
| 3  | Conciseness             |  ?/10 | {one-sentence rationale}       |
| 4  | Branch completeness     |  ?/10 | {one-sentence rationale}       |
| 5  | Path termination        |  ?/10 | {one-sentence rationale}       |
| 6  | Explicit completion     |  ?/10 | {one-sentence rationale}       |
| 7  | Self-containment        |  ?/10 | {one-sentence rationale}       |
| 8  | Action vocabulary       |  ?/10 | {one-sentence rationale}       |
| 9  | Escalation coverage     |  ?/10 | {one-sentence rationale}       |
| 10 | Data source distinction |  ?/10 | {one-sentence rationale}       |

Overall: ?.? / 10
```

Then list every flagged issue:

```
--- Flagged Issues ---
[BRANCH]     Step N — {missing else/else if}
[TERMINAL]   Step N — {branch with no Complete or Escalate}
[COMPLETION] Step N — {missing or paraphrased Use finish call}
[VOCAB]      Step N — {non-canonical phrasing}
[CROSS-TASK] Step N — {cross-task reference}
[VAGUE]      Step N — {vague field/document reference}
[ESCALATION] Step N — {missing escalation or missing reason}
[SOURCE]     Step N — {ambiguous data source}
```

If no issues in a category, omit it. If no issues at all, print `No issues found.`

---

## Rewrite Phase

If overall score < 9.0, collect all confirmations first, then apply all rewrites in one pass, then re-score.

**Confirmation rules by flag type:**

- `[BRANCH]` — **pause and confirm**: show the incomplete step and ask: "Step N has no else/else if — what should happen when the condition is not met? Should it Complete or Escalate, and with what reason?" Wait for the answer.
- `[TERMINAL]` — **pause and confirm**: show the branch that trails off and ask: "Step N — branch has no terminal action. Should it Complete (`Use finish with status=completed`) or Escalate? If Escalate, what is the reason?" Wait for the answer.
- `[COMPLETION]` — **pause and confirm**: show the paraphrased line and ask: "Step N has a paraphrased completion call — should this be replaced with `Use finish with status=completed` verbatim? Confirm or provide the exact phrasing to use." Wait for the answer.
- `[VOCAB]` — replace with the exact canonical phrasing from the action vocabulary table. No confirmation needed.
- `[ESCALATION]` — add a stated reason string in single quotes. No confirmation needed.
- `[CROSS-TASK]` — rewrite as an explicit runtime lookup (`Use list_objectives to find...` or `Use search_loan_data_model to get...`). No confirmation needed.
- `[VAGUE]` — **pause and confirm**: show the vague reference and ask: "Step N uses '[vague term]' — what is the exact field name / document name to use here?" Wait for the answer.
- `[SOURCE]` — **pause and confirm**: show the ambiguous step and ask: "Step N accesses data without specifying the source — should this read from loan data (`Use search_loan_data_model`) or review a document (`Review the [document]`)? If a document, what is its name?" Wait for the answer.

List all flags requiring confirmation (`[BRANCH]`, `[TERMINAL]`, `[COMPLETION]`, `[VAGUE]`, `[SOURCE]`) in a single message and collect all answers at once — do not ask one at a time. Flags that do not require confirmation (`[VOCAB]`, `[ESCALATION]`, `[CROSS-TASK]`) are applied automatically.

After all confirmations are collected and all rewrites applied, re-run the full scoring rubric and print a second scorecard.

If the score is still < 9.0 after one rewrite pass, do a second targeted pass on remaining flagged issues, then re-score. Continue until score >= 9.0.

---

## Save Phase

Once the score is >= 9.0:

1. Create `output-prompts/` in the workspace root if it does not exist.
2. Derive the task slug from the task name (lowercase, hyphens, no special characters).
3. Save the file as `output-prompts/{task-slug}.md`.

The file must contain **only** these elements — nothing else:

```markdown
# 🤖 ✦ ✦ ✦  Generated using "Sid's Prompt Factory"  ✦ ✦ ✦ 🤖

# {Task Name}

## Checklist Steps

**1.** ...

**2.** ...
```

No metadata, no External ID, no Relevance section, no Completion Conditions.

---

## Completion Summary

After saving, print:

```
## Prompt Factory — Done

Task:        {Task Name}
File:        output-prompts/{task-slug}.md
Initial score:   ?.? / 10
Final score:     ?.? / 10
Rewrite passes:  N
```

---

## Anti-Patterns (never write these)

| Bad | Good |
|-----|------|
| "If the credit review found issues, escalate." | "Review the credit report. If any tradeline shows 60+ days past due in the last 12 months, escalate the objective with the reason 'Derogatory tradeline found.'" |
| "Make sure the borrower's income is right." | "Use search_loan_data_model to get the borrower's monthly income. Review the pay stubs and W-2s. If they don't match, set the monthly income field to the lesser of the two. Write a note summarizing what was changed and why." |
| "Notify the borrower of missing documents." | "Write a note listing the missing documents and escalate the objective with the reason 'Missing documents require borrower follow-up.'" |

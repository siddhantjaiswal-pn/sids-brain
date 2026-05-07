---
name: prompt-factory
description: >-
  Orchestrates the full Vesta prompt lifecycle for a single task: takes a
  detailed workflow description, writes Checklist Steps using Prompt Designer
  rules and 11 internal quality checks, scores across 11 dimensions (rubric
  delegated to score-prompt), rewrites to fix all flagged issues, and saves
  the final prompt to output-prompts/. Use when the user says "prompt factory",
  "run prompt factory", "create a prompt", "generate a prompt for [task]",
  "score and rewrite this prompt", "fix this prompt", or provides a task
  description and wants a production-ready Vesta agent task prompt.
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

Immediately after the banner, determine the mode:

- If the user's message references a `.md` file path → **Existing Prompt Mode** — do NOT ask the question; go directly to [Existing Prompt Mode](#existing-prompt-mode).
- If the user's message contains a workflow description but no file path → **New Prompt Mode** — do NOT ask the question; go directly to [New Prompt Mode](#new-prompt-mode).
- If the intent is ambiguous → ask:

> "Are we creating a **new** prompt or improving an **existing** one?"

- If **new** → follow [New Prompt Mode](#new-prompt-mode)
- If **existing** → follow [Existing Prompt Mode](#existing-prompt-mode)

---

## New Prompt Mode

### Step 1 — Gather workflow description

Ask the user for one thing only:

> "Describe the full workflow for this task in as much detail as you can — what the agent should do, any branching conditions, calculations, escalation triggers, and what success looks like."

After the user provides their description, always ask the following two questions plus any additional clarifying questions needed to resolve ambiguities. Collect all questions in a single message — do not ask one at a time:

1. When should the agent escalate? What reason should the note include?
2. What does successful completion look like? What summary note should the agent leave?

Also cover any ambiguities found in the description: missing branch conditions, unclear escalation triggers, undefined field names, document names, or calculation rules.

Derive the task name silently from the workflow description (e.g. a description about verifying the loan amount → "Verify Loan Amount"). Do not ask the user to confirm the name — it is used internally for the Save Phase and Completion Summary.

### Step 2 — Write Checklist Steps

Once all clarifying questions are answered, use the full description plus answers to write the Checklist Steps. Apply every internal quality check below silently — do not ask the user about them:

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
11. Does any step reference the agent navigating a UI, clicking buttons, selecting fields from a screen, or interacting with any interface? The agent has **no UI access whatsoever** — rewrite as an explicit data lookup or document review.

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

**Action vocabulary:**

The canonical action vocabulary lives in `.cursor/skills/vesta-prompt-designer/SKILL.md` under the **Action Vocabulary** section. Read that file and apply every phrasing exactly. Do not paraphrase or invent new actions. If a needed action is not in the vocabulary, escalate to the user and ask which canonical phrasing to use.

### Step 3 — Confirm before scoring

Show the full drafted steps. Ask:

> "Does this look right? Confirm to proceed to scoring, or tell me what to change."

Apply any requested changes and re-show before proceeding. Do NOT enter the scoring loop until confirmed.

---

## Existing Prompt Mode

### Step 1 — Read the file

Read the `.md` file the user points to.

### Step 2 — Run initial QC scan

Before asking the user anything, score the prompt across all 11 dimensions using the canonical rubric defined in `.cursor/skills/score-prompt/SKILL.md`. Read that file and apply its rubric, scorecard format, and flag taxonomy verbatim. Print the full scorecard and flagged issues list.

**Fast path — if the initial overall score is >= 9.0:**

The prompt already meets the quality bar. Do NOT offer a rewrite by default. Instead present:

> "**Initial QC scan complete.**
>
> Score: **X.X / 10** — already meets the 9.0+ quality bar; no rewrite needed.
>
> [scorecard table]
>
> [flagged issues list, if any]
>
> Anything specific you'd still like changed?"

- If the user says **no / nothing** → stop. Do not proceed.
- If the user names specific changes → continue to Step 3 with their requested changes only (skip the "fix all flagged issues" framing).

**Standard path — if the initial overall score is < 9.0:**

Present:

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

> "What should change? Say **'fix all flagged issues'** to address everything from the QC scan, or tell me which specific steps to update, new rules to add, or edge cases to handle."

Do NOT make changes until answered. If a new constraint conflicts with an existing one, flag it and ask which takes precedence.

### Step 4 — Apply updates

Apply the same formatting rules, action vocabulary, and internal quality checklist from [New Prompt Mode — Step 2](#step-2--write-checklist-steps).

Show the full updated steps. Ask for confirmation before proceeding to scoring.

---

## Score Phase

After confirmed steps, score the prompt by **applying the canonical rubric defined in `.cursor/skills/score-prompt/SKILL.md`**. Run this internally — produce the scorecard and flagged issues list in chat.

**How to run the Score Phase:**

1. Read `.cursor/skills/score-prompt/SKILL.md` and load its 11-dimension rubric.
2. For each dimension, assign a 0–10 score with a one-sentence rationale.
3. Render the scorecard using the **exact format** specified in score-prompt's "Step 4 — Render the scorecard" section. Prepend the local header `## Prompt Scorecard` so the user can distinguish factory output from a standalone score-prompt call.
4. List flagged issues using the exact flag taxonomy (`[BRANCH]`, `[TERMINAL]`, `[COMPLETION]`, `[VOCAB]`, `[CROSS-TASK]`, `[VAGUE]`, `[ESCALATION]`, `[SOURCE]`, `[UI-ACCESS]`) defined there.
5. Compute the overall score as the simple average across all 11 dimensions, rounded to one decimal place.

**Single source of truth:** Do not redefine, paraphrase, or extend the rubric in this file. If the rubric needs updating, edit `score-prompt/SKILL.md` — every other skill (including this one) reads from there.

---

## Rewrite Phase

If overall score < 9.0, collect all confirmations first, then apply all rewrites in one pass, then re-score.

**Confirmation rules by flag type:**

- `[BRANCH]` — **pause and confirm**: show the incomplete step and ask: "Step N has no else/else if — what should happen when the condition is not met? Should it Complete or Escalate, and with what reason?" Wait for the answer.
- `[TERMINAL]` — **pause and confirm**: show the branch that trails off and ask: "Step N — branch has no terminal action. Should it Complete (`Use finish with status=completed`) or Escalate? If Escalate, what is the reason?" Wait for the answer.
- `[COMPLETION]` — **pause and confirm**: show the paraphrased line and ask: "Step N has a paraphrased completion call — should this be replaced with `Use finish with status=completed` verbatim? Confirm or provide the exact phrasing to use." Wait for the answer.
- `[VOCAB]` — replace with the exact canonical phrasing from the Action Vocabulary section in `.cursor/skills/vesta-prompt-designer/SKILL.md`. No confirmation needed.
- `[ESCALATION]` — add a stated reason string in single quotes. No confirmation needed.
- `[CROSS-TASK]` — rewrite as an explicit runtime lookup (`Use list_objectives to find...` or `Use search_loan_data_model to get...`). No confirmation needed.
- `[VAGUE]` — **pause and confirm**: show the vague reference and ask: "Step N uses '[vague term]' — what is the exact field name / document name to use here?" Wait for the answer.
- `[SOURCE]` — **pause and confirm**: show the ambiguous step and ask: "Step N accesses data without specifying the source — should this read from loan data (`Use search_loan_data_model`) or review a document (`Review the [document]`)? If a document, what is its name?" Wait for the answer.
- `[UI-ACCESS]` — **pause and confirm**: show the step and ask: "Step N references UI navigation or field selection — the agent has no UI access. What should it actually retrieve? Use `search_loan_data_model` for loan data fields, or `Review the [document]` for a document. What specifically is it trying to get?" Wait for the answer.

List all flags requiring confirmation (`[BRANCH]`, `[TERMINAL]`, `[COMPLETION]`, `[VAGUE]`, `[SOURCE]`, `[UI-ACCESS]`) in a single message and collect all answers at once — do not ask one at a time. Flags that do not require confirmation (`[VOCAB]`, `[ESCALATION]`, `[CROSS-TASK]`) are applied automatically.

After all confirmations are collected and all rewrites applied, print a brief "Changes applied" summary before re-scoring:

```
--- Changes Applied ---
• Step N: [what changed, one line]
• Step N: [what changed, one line]
```

### Re-scoring with a Diff Scorecard

After each rewrite pass, re-run the full rubric internally — but **only print the dimensions whose score changed** plus the new overall. The full scorecard is reprinted only at the very end of the pipeline (in the Completion Summary path) or when the user explicitly asks for it.

Diff scorecard format:

```
## Diff Scorecard — Pass N

| #  | Dimension               | Before | After | Δ    | Notes                          |
|----|-------------------------|--------|-------|------|--------------------------------|
| 4  | Branch completeness     | 6/10   | 10/10 | +4   | All if/else branches now closed |
| 8  | Action vocabulary       | 7/10   | 10/10 | +3   | Replaced 3 informal phrasings   |
| 11 | No UI references        | 4/10   | 10/10 | +6   | Removed UI-click step in step 5 |

Overall: was X.X / 10  →  now Y.Y / 10  (Δ +Z.Z)

Remaining flags: [list any flag tags still open, or "None"]
```

If no dimensions changed, print `No score change after Pass N — re-evaluating remaining flags.` and proceed to the next pass (subject to the cap).

### Iteration Cap

The rewrite loop is **capped at 3 passes**. After each pass:

- If overall score >= 9.0 → exit the rewrite loop and proceed to Save Phase.
- If overall score < 9.0 and pass count < 3 → run another targeted rewrite pass on remaining flagged issues.
- If pass count == 3 and overall score is still < 9.0 → **stop and escalate to the user**:

> "**Iteration cap reached.** Score is **X.X / 10** after 3 rewrite passes — still below the 9.0 quality bar.
>
> **Top remaining flags:**
> 1. [flag tag] Step N — [issue]
> 2. [flag tag] Step N — [issue]
> 3. [flag tag] Step N — [issue]
>
> How would you like to proceed?
> - **Save anyway** — write the file at the current score (will be recorded in the Completion Summary).
> - **Restart** — discard current draft and rewrite from scratch with a different approach.
> - **Stop** — abandon the run; do not save anything."

Wait for the user's choice before doing anything else.

**Second-pass confirmation rules:** If the second (or any subsequent) pass surfaces new confirmation-required flags (`[BRANCH]`, `[TERMINAL]`, `[COMPLETION]`, `[VAGUE]`, `[SOURCE]`, `[UI-ACCESS]`), collect all of them in a single message — the same way as the first pass — before applying any rewrites. Do not apply auto-fixed flags (`[VOCAB]`, `[ESCALATION]`, `[CROSS-TASK]`) separately; batch them with the rewrite pass after confirmations are received.

---

## Save Phase

Enter the Save Phase when **either** condition is true:

- The overall score is >= 9.0, OR
- The iteration cap was reached and the user chose **Save anyway**.

Steps:

1. Create `output-prompts/` in the workspace root if it does not exist.
2. Derive the task slug from the task name auto-derived in New Prompt Mode Step 1 (or from the existing file name in Existing Prompt Mode). Lowercase, hyphens, no special characters.
3. Check whether `output-prompts/{task-slug}.md` already exists.
   - If it **does not exist** → save normally.
   - If it **already exists** → ask: "output-prompts/{task-slug}.md already exists. Overwrite it, or save as `{task-slug}-v2.md`?" Wait for the answer before writing.
4. Save the file to the confirmed path as `output-prompts/{task-slug}.md` (or the versioned name).

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

Task:            {Task Name}
File:            output-prompts/{task-slug}.md
Initial score:   ?.? / 10
Final score:     ?.? / 10
Rewrite passes:  N
Quality bar:     met | NOT MET (saved at user's request after iteration cap)
```

If the file was saved below 9.0 because the user picked **Save anyway** at the iteration cap, set `Quality bar` to `NOT MET` and append a one-line list of the unresolved flag tags so it is visible at a glance.

---

## Anti-Patterns

The canonical anti-patterns list lives in `.cursor/skills/vesta-prompt-designer/SKILL.md` under the **Anti-Patterns** section. Read that file and apply the same Bad → Good rewrites when correcting drafted steps. Do not duplicate or extend the list here — edit the canonical file instead so every skill picks up the change.

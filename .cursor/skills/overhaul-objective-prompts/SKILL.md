---
name: overhaul-objective-prompts
description: Audits and rewrites all agent instruction task prompts under a Vesta objective. Phase 1 scores every instruction task across 10 quality dimensions and shows a summary scorecard. Phase 2 (after user confirmation) launches parallel subagents to rewrite all tasks to 9+ quality and saves results to output-prompts/. Use when the user says "overhaul prompts for [objective]", "rewrite all tasks under [objective]", "score and fix [objective] prompts", or points to an objective directory and asks for a quality pass.
---

# Overhaul Objective Prompts

When this skill is invoked, print this banner first:

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         ✦  Sid's Objective Prompt Pipeline  ✦                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Phase 1 — Locate and Classify

### Step 1 — Identify the objective

- If the user names an objective (e.g. `agent-low-doc-review`), resolve its path under `Vesta/config/objectives/`.
- If the user is viewing a file inside an objective's `tasks/` folder, infer the objective from the path.
- If unclear, ask the user to confirm the objective name before proceeding.

### Step 2 — List all task files

List all `.md` files under `{objective}/tasks/`.

Classify each file:
- **Instruction task** — has `**Type**: Instructions` and a `## Checklist Steps` section → eligible for scoring and rewriting
- **DocumentProcessing / Auto-Complete** — has `**Type**: DocumentProcessing` and no `## Checklist Steps` → skip (note in output but do not score or rewrite)

---

## Phase 2 — Score All Instruction Tasks

Read the full scoring rubric from:
`/Users/sijaiswal/Sids Brain/.cursor/skills/score-prompt/SKILL.md`

**If there is only 1 instruction task**, read and score it directly in the main agent.

**If there are 2 or more instruction tasks**, launch one background subagent per task using `subagent_type: generalPurpose` — all in a single message (parallel). Each subagent prompt must:

1. Include the full contents of `/Users/sijaiswal/Sids Brain/.cursor/skills/score-prompt/SKILL.md` verbatim.
2. Include the full contents of the task `.md` file being scored.
3. Instruct the subagent to return **only** the scorecard table and the full flagged issues list — no rewrites, no file writes.

Wait for all scoring subagents to complete, then collect their results.

### Scorecard output format

After all tasks are scored, print:

```
## Scorecard — {Objective Name}

| Task | Score | Lowest Dims | Critical Flags |
|------|-------|-------------|----------------|
| task-name | X.X/10 | dim1, dim2 | [BRANCH] step N — ..., [TERMINAL] ... |
...

Objective average: X.X / 10
DocumentProcessing tasks skipped (no Checklist Steps): task-a, task-b, ...
```

### Confirmation gate

After printing the scorecard, ask:

> "Ready to rewrite all instruction tasks targeting 9+ on every dimension? I'll launch one subagent per task in parallel and save results to `output-prompts/{objective-name}/`. Confirm to proceed."

**Do not proceed to Phase 3 until the user confirms.**

---

## Phase 3 — Parallel Rewrites

Read the full designer rules and action vocabulary from:
`/Users/sijaiswal/Sids Brain/.cursor/skills/vesta-prompt-designer/SKILL.md`

For each instruction task, launch a **separate background subagent** using `subagent_type: generalPurpose`. Launch all subagents in a single message (parallel).

### Subagent prompt template

Each subagent prompt must include all of the following — do not omit any section:

```
You are rewriting the Checklist Steps of a Vesta agent task prompt file.
Your goal: score 9 or above on ALL 10 quality dimensions.
Save to: /Users/sijaiswal/Sids Brain/output-prompts/{objective-name}/{task-slug}.md

---
## DESIGNER RULES

[Paste the Core Rules and Action Vocabulary sections from vesta-prompt-designer/SKILL.md verbatim]

---
## ORIGINAL FILE CONTENT

[Full content of the original task .md file]

---
## SCORED ISSUES TO FIX

Score: X.X/10
[Full flagged issues list from Phase 2 for this task, with descriptions]
[Include explicit fix guidance for each flagged issue]

---
## OUTPUT FORMAT

Create /Users/sijaiswal/Sids Brain/output-prompts/{objective-name}/ if it does not exist
(mkdir -p the full directory path before writing).
Write /Users/sijaiswal/Sids Brain/output-prompts/{objective-name}/{task-slug}.md.

File must contain ONLY:

# 🤖 ✦ ✦ ✦  Created using Sid's Prompt Generator  ✦ ✦ ✦ 🤖

# {Task Name}

## Checklist Steps

**1.** ...

No metadata, no External ID, no Relevance section, no Completion Conditions.
Do not ask questions — all context is provided.
```

### Subagent fix guidance rules

When building the "SCORED ISSUES TO FIX" section for each subagent:

- For every `[BRANCH]` flag: add a specific else/else if branch that terminates in Complete or Escalate.
- For every `[TERMINAL]` flag: add `Escalate the objective with the reason '...'` or `Use finish with status=completed` as the terminal.
- For every `[COMPLETION]` flag: replace paraphrased completion with `Use finish with status=completed` verbatim.
- For every `[VOCAB]` flag: replace with the exact canonical phrasing from the action vocabulary.
- For every `[ESCALATION]` flag: add a stated reason string in single quotes.
- For every `[CROSS-TASK]` flag: rewrite as an explicit runtime lookup (`Use list_objectives to find...`) rather than a memory reference.
- For every `[VAGUE]` flag: replace with the exact field name, document name, or criteria.
- For every `[SOURCE]` flag: add explicit `Use search_loan_data_model` or `Review the [document]` call.

---

## Phase 4 — Completion Report

Once all subagents finish, print a summary table:

```
## Overhaul Complete — {Objective Name}

| Task | Original | Reported Score | Output File |
|------|----------|----------------|-------------|
| task-name | X.X | X.X | output-prompts/{objective-name}/task-name.md |
...

All rewritten files saved to output-prompts/{objective-name}/.
Original task files were not modified.
```

---

## Important constraints

- Never modify the original task files in `Vesta/config/objectives/`.
- Always save rewrites to `output-prompts/{objective-name}/{task-slug}.md` — never to the source directory.
- The output directory name must match the objective slug exactly (e.g. `agent-low-doc-review`).
- DocumentProcessing tasks are never rewritten — they have no instruction steps to improve.
- If a task already scores 9+ on all dimensions, note it in the scorecard but still include it in the rewrite pass (the subagent will preserve the content and make only minimal fixes if any).

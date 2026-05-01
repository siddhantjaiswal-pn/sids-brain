# Sid's Prompt Factory — How It Works

Prompt Factory is a Cursor agent skill that takes a plain-English workflow description and produces a production-ready Vesta agent task prompt. It handles writing, quality scoring, and rewriting automatically — you only need to describe what the agent should do.

---

## Who is this for?

Anyone writing or improving Vesta agent task prompts. Instead of manually applying a long list of prompt-writing rules, you hand off your workflow description and the factory handles the rest.

---

## How to invoke it

Just say one of these in Cursor chat:

- `prompt factory`
- `run prompt factory`
- `create a prompt for [task]`
- `generate a prompt for [task]`
- `score and rewrite this prompt`

The skill activates automatically.

---

## The Full Pipeline

```
You describe the workflow
        │
        ▼
┌───────────────────┐
│  Step 1: Write    │  Agent reads your description and writes numbered
│  Checklist Steps  │  Checklist Steps using Vesta's prompt design rules.
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Step 2: Confirm  │  Agent shows you the full drafted steps.
│  Gate             │  You approve or ask for changes before anything is scored.
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Step 3: Score    │  Agent scores the prompt across 10 quality dimensions
│  (0–10 each)      │  and prints a scorecard + flagged issues list.
└────────┬──────────┘
         │
    Overall >= 9.0?
    ┌────┴────┐
   No        Yes
    │          │
    ▼          ▼
┌──────────┐  ┌─────────────────┐
│ Rewrite  │  │  Step 4: Save   │
│ to fix   │  │  output-prompts/│
│ all flags│  └────────┬────────┘
└────┬─────┘           │
     │ Re-score         ▼
     └──────────► Completion Summary
```

---

## Two Modes

### New Prompt
You describe a workflow → the agent writes it from scratch.

**What to include in your description:**
- What should happen step by step
- Any branching conditions (e.g. "if the loan is in Texas, apply rule X")
- Any calculations (e.g. "calculate max loan amount based on LTV")
- When the agent should escalate and why
- What a successful outcome looks like

You do not need to worry about prompt formatting rules — the agent applies them internally.

### Existing Prompt
Point the agent to a `.md` file. The factory runs an **initial QC scan first** — no questions asked, no edits made. It scores the prompt across all 10 dimensions, prints the full scorecard and flagged issues, then asks:

> "Score is X.X/10. Want me to improve this prompt?"

If you say yes, it asks what needs to change (or you can say "fix all flagged issues"), applies your changes, then runs the standard score → rewrite → save loop. If you say no, it stops — nothing is touched.

---

## The 10 Quality Dimensions

Every prompt is scored 0–10 on each of these before it is saved:

| # | Dimension | What it checks |
|---|-----------|---------------|
| 1 | Specificity | Are exact field names, document types, and values named everywhere? |
| 2 | Clarity | Does each step say what to check, what to look for, and what to do with the result? |
| 3 | Conciseness | Is there any padding, repetition, or prose that doesn't belong in instructions? |
| 4 | Branch completeness | Does every `if` condition have a matching `else` or `else if`? |
| 5 | Path termination | Does every branch end in Complete or Escalate — no dead ends? |
| 6 | Explicit completion call | Does the success path say `Use finish with status=completed` verbatim? |
| 7 | Self-containment | Does any step reference what a previous task found? (Cross-task memory is a defect.) |
| 8 | Action vocabulary | Are Vesta's canonical action phrasings used throughout? |
| 9 | Escalation coverage | Does every failure condition route to an explicit escalation with a stated reason? |
| 10 | Data source distinction | Are loan data reads and document reviews kept clearly separate? |

The prompt must score **9.0 or above overall** before it is saved.

---

## Automatic Rewrite Loop

If the initial score is below 9.0, the agent rewrites the prompt to fix every flagged issue and scores it again. This loop runs automatically until the score reaches 9.0+. You do not need to intervene.

Each flag type has a specific fix:

| Flag | What the agent asks / fixes | Confirmation required? |
|------|----------------------------|----------------------|
| `[BRANCH]` | Asks: *"Step N has no else/else if — what should happen when the condition is not met? Complete or Escalate, and with what reason?"* | **Yes — you confirm** |
| `[TERMINAL]` | Asks: *"Step N branch has no terminal — Complete or Escalate? If Escalate, what is the reason?"* | **Yes — you confirm** |
| `[COMPLETION]` | Asks: *"Step N has a paraphrased completion — replace with `Use finish with status=completed` verbatim? Confirm or provide exact phrasing."* | **Yes — you confirm** |
| `[VOCAB]` | Replaces informal phrasing with the canonical Vesta action phrase | No — auto-fixed |
| `[ESCALATION]` | Adds a stated reason string in single quotes | No — auto-fixed |
| `[CROSS-TASK]` | Rewrites as an explicit runtime lookup | No — auto-fixed |
| `[VAGUE]` | Asks: *"Step N uses '[vague term]' — what is the exact field or document name?"* Then substitutes your answer | **Yes — you confirm** |
| `[SOURCE]` | Asks: *"Step N — loan data or document review? If document, what is its name?"* Then substitutes your answer | **Yes — you confirm** |

> All confirmation flags (`[BRANCH]`, `[TERMINAL]`, `[COMPLETION]`, `[VAGUE]`, `[SOURCE]`) are collected in a single message before any rewriting begins — never one at a time. Auto-fixed flags (`[VOCAB]`, `[ESCALATION]`, `[CROSS-TASK]`) are applied without asking.

---

## Output File

Every prompt saved by this skill:

- Lives in `output-prompts/{task-slug}.md` in the workspace root
- Starts with the header: `# 🤖 ✦ ✦ ✦  Generated using "Sid's Prompt Factory"  ✦ ✦ ✦ 🤖`
- Contains only the task title and Checklist Steps — no metadata, no External ID, no Completion Conditions

Original source files are **never modified**.

---

## Completion Summary

After saving, the agent prints:

```
## Prompt Factory — Done

Task:           {Task Name}
File:           output-prompts/{task-slug}.md
Initial score:  X.X / 10
Final score:    X.X / 10
Rewrite passes: N
```

---

## Related Skills

| Skill | What it does |
|-------|-------------|
| `vesta-prompt-designer` | Writes or updates a single prompt interactively (asks you 10 questions) |
| `score-prompt` | Scores an existing prompt — no writes, no rewrites |
| `overhaul-objective-prompts` | Scores and rewrites every instruction task under an entire objective in parallel |

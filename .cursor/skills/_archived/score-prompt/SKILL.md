---
name: score-prompt
description: >-
  Scores a Vesta agent task prompt (.md) file across 11 quality dimensions on a 0–10 scale,
  producing a scorecard table with per-dimension rationale and a flagged issues list.
  This skill is the canonical source of the prompt scoring rubric — other skills
  (prompt-factory, overhaul-objective-prompts) reference it. Use when the user says
  "score this prompt", "grade this task", "evaluate this .md", "rate my prompt",
  "audit this task file", "check prompt quality", or provides a .md path and asks for
  a quality review. Also use automatically after vesta-prompt-designer saves a file.
---

# Prompt Scorer

When this skill is invoked, print this banner first before doing anything else:

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              ✦  Sid's Prompt Scorer  ✦                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Reads a Vesta task `.md` file and scores it across 11 quality dimensions. Output is chat-only — never modify the target file.

> This skill is the **canonical source** of the Vesta prompt scoring rubric. Other skills (`prompt-factory`, `overhaul-objective-prompts`) read this file at runtime and apply the same rubric, scorecard format, and flag taxonomy defined here. Edit this file once to update scoring everywhere.

---

## Step 1 — Locate the file

- If the user provides a file path, use it.
- If no path is given, check `output-prompts/` in the workspace root for the most recently modified `.md` file and use that.
- If no file can be located, ask the user to provide the path before proceeding.

## Step 2 — Read the file

Read the full contents. Note the number of top-level steps and whether a `## Checklist Steps` section is present.

## Step 3 — Score all 11 dimensions

For each dimension, assign a score from 0–10 and write a one-sentence rationale. Use the rubric below.

### Scoring Rubric

**1. Specificity**
Does every step name exact field names, document types, and values? Deduct for vague references like "the loan", "the document", "the income", or "the data".
- 10: Every field, document, and value is named explicitly throughout.
- 5–9: Most are explicit; a few vague references remain.
- 1–4: Multiple steps rely on generic terms without specifics.
- 0: No specifics — entirely vague.

**2. Clarity**
Does each step answer: what to check, what to look for, and what to do with the result?
- 10: Every step has all three components; intent is unambiguous.
- 5–9: Most steps are clear; one or two leave the outcome undefined.
- 1–4: Several steps are ambiguous about what the agent should do.
- 0: Steps are unclear throughout.

**3. Conciseness**
Is each step free of padding, repetition, and prose explanations that don't belong in instructions?
- 10: Tight, action-focused writing with no filler.
- 5–9: Minor repetition or one over-explained section.
- 1–4: Noticeable padding or repeated content across steps.
- 0: Bloated throughout.

**4. Branch completeness**
Does every `If [condition]` have a matching `else` or `else if` branch? No unhandled paths.
- 10: Every conditional branch is fully handled.
- 5–9: One or two branches missing an else/else if.
- 1–4: Multiple if blocks with no else handling.
- 0: Conditions throughout have no else.

**5. Path termination**
Does every branch (success and failure) end in Complete or Escalate? No dead ends.
- 10: Every branch terminates explicitly.
- 5–9: One branch trails off without a terminal action.
- 1–4: Several branches have no stated terminal.
- 0: Most branches have no terminal action.

**6. Explicit completion call**
Does the success-path final step contain `Use finish with status=completed` verbatim?
- 10: Present verbatim on the success path.
- 5: Present but paraphrased ("complete the task") rather than the exact call.
- 0: Absent entirely.

**7. Self-containment**
Does any step reference what a previous task found or decided? (Cross-task memory references are a defect.)
- 10: No cross-task references anywhere.
- 5–9: One ambiguous reference that could be interpreted as cross-task.
- 1–4: One or more explicit cross-task references.
- 0: Multiple cross-task references.

**8. Action vocabulary**
Does the prompt use the canonical action phrasings from the Vesta Prompt Designer?

Canonical phrasings: `Set [field] to [value]` · `Write a note stating` · `Escalate the objective with the reason` · `Block the objective for` · `Review the [document]` · `Get the [document]` · `Run get_loan_validations` · `Order [service]` · `Use search_loan_data_model` · `Use list_objectives` · `Use finish with status=completed` · `Mark the document as Accepted` · `Mark the document as Reviewed`

- 10: All actions use canonical phrasings.
- 5–9: Mostly canonical; one or two informal phrasings.
- 1–4: Several non-standard phrasings.
- 0: No canonical phrasings used.

**9. Escalation coverage**
Does every failure condition, missing-data case, and constraint violation route to an explicit escalation with a stated reason?
- 10: Every failure path has `Escalate the objective with the reason '[reason]'`.
- 5–9: Most failures covered; one escalation missing a stated reason.
- 1–4: Some failure paths have no escalation or no reason given.
- 0: No explicit escalation paths.

**10. Data source distinction**
Are loan data reads (`Use search_loan_data_model`) and document reviews (`Review the [document]`) kept distinct and never conflated?
- 10: Every data access explicitly names the source (loan data vs document).
- 5–9: Mostly clear; one step is ambiguous about which source it uses.
- 1–4: Multiple steps conflate loan data and documents.
- 0: Source is never specified.

**11. No UI references**
Does any step instruct the agent to navigate a UI, click a button, select a field from a screen, or interact with any interface? The agent has no UI access whatsoever — every UI reference is a defect.
- 10: No UI references anywhere.
- 5–9: One ambiguous phrasing that could imply UI interaction.
- 1–4: One or more explicit UI navigation steps.
- 0: Multiple UI references throughout.

---

## Step 4 — Render the scorecard

Output in this exact format:

```
File: {relative path to the scored file}

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
| 11 | No UI references        |  ?/10 | {one-sentence rationale}       |

Overall: ?.? / 10  (average across 11 dimensions)
```

Then list every flagged issue found, tagged by category:

```
--- Flagged Issues ---
[BRANCH]     Step N — {description of missing else/else if}
[TERMINAL]   Step N — {branch with no Complete or Escalate}
[COMPLETION] Step N — {missing or paraphrased Use finish call}
[VOCAB]      Step N — {non-canonical action phrasing found}
[CROSS-TASK] Step N — {cross-task reference detected}
[VAGUE]      Step N — {vague field/document reference}
[ESCALATION] Step N — {failure condition missing escalation or missing reason}
[SOURCE]     Step N — {ambiguous data source}
[UI-ACCESS]  Step N — {UI navigation, click, or field-selection reference}
```

If there are no flagged issues in a category, omit that category. If there are no issues at all, print `No issues found.`

---

## Scoring Notes

- Compute the overall score as the simple average of all 11 scores, rounded to one decimal place.
- Do not modify the file being scored.
- Do not write any output files.
- Do not suggest rewrites unless the user asks — just score and flag.

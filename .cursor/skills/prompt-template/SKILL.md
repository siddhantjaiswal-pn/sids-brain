---
name: prompt-template
description: Generates a guardrail-compliant skeleton prompt for a new Vesta agent task. Collects task name, documents, and loan data fields, then writes a pre-structured .md file. Always runs as the entry point for Line A (Build) in Prompt Factory v2 when the user has no draft. Use when the user says "generate a template", "scaffold a prompt", "give me a starting point", or starts Line A without an existing draft.
disable-model-invocation: true
---

# Prompt Template Generator

Generates a guardrail-compliant skeleton prompt and saves it to the correct objective folder. Always hands off to Line A (guardrails → score → save) after saving.

---

## Step 1 — Collect task details

Ask all of the following in a single message:

> 1. **Task name** — what should this task be called? (used for the file name, e.g. `closing-date-check`)
> 2. **Documents** — list any uploaded documents the agent will need to review (e.g. "W-2 document, Pay Stub document") — or "none"
> 3. **Loan data fields** — list any loan data fields the agent will need to look up (e.g. "Closing Date, Borrower's Monthly Income") — or "none"
> 4. **Checks** — list each thing this task must verify, one per check (e.g. "signatures, dates, loan amount matches"). Each becomes its own `CHECK` step in the scaffold.

Wait for the user's complete response before proceeding. The checks list determines how many `CHECK` steps the scaffold contains (one per check).

---

## Step 2 — Generate the skeleton

Use the collected details to generate the skeleton below. Substitute all placeholders with the user's inputs.

**Structural rules:**
- Every step label: `STEP N: [UPPERCASE LABEL]`
- Document references always include "document" (e.g. "Wire Instructions document")
- Field lookups always use `Use search_loan_data_model to get [Field Name]`
- All findings tracked as **PASS** or **FAIL** (capitalized)
- Stage order: Gather → Check(s) → Compare → Notes → Decision
- Notes always comes before Decision
- Decision is the final step — no separate Complete step
- Leave `[specify criteria]`, `[value]`, `[reason]` as explicit placeholders — do not invent logic

---

### Template

```markdown
# [Task Display Name]

STEP 1: GET ALL DOCUMENTS
Get the [Document Name] document from the loan file.
[Repeat for each required document:]
Get the [Second Document Name] document from the loan file.
IF the [Document Name] document cannot be located: Escalate the objective with the reason '[Document Name] document missing from loan file.'
IF all required documents are located: proceed to the next step.

STEP 2: CHECK [CRITERION LABEL]
Review the [Document Name] document.
Check for [specify criteria — e.g. all borrower signatures present, date is within range, amount matches].
IF [condition is not met]: Track that [criterion] as FAIL — [summarize the finding].
IF [condition is met]: Track that [criterion] as PASS.
Proceed to the next step.

[Repeat one STEP block per additional check]

STEP N: COMPARE AGAINST [LOAN DATA / SECOND DOCUMENT NAME] ← delete if no comparison needed
← Use the source that applies:
Use search_loan_data_model to get [Field Name].
  — OR —
Review the [Second Document Name] document.
Compare [value from document] against [loan field value / value from second document].
IF values do not match: Track that comparison as FAIL — [summarize the discrepancy].
IF values match: Track that comparison as PASS.
Proceed to the next step.

STEP N+1: NOTES
Write a note stating:
- Which documents were reviewed OR which fields were reviewed/updated
- The result of each check (PASS or FAIL, with the specific finding)
- Whether each document was accepted or not accepted, and the reason
- [Add any additional specific items to capture here]

STEP N+2: DECISION
Review all tracked findings from the preceding steps.
IF any finding was tracked as FAIL:
  Do not mark the [Document Name] document as Accepted.
  [Escalate the objective with the reason '[reason — summarize issues]' / Do not complete the task.]
IF all findings were tracked as PASS:
  Mark the [Document Name] document as Accepted.
  Finish with status = Completed.
```

---

## Step 3 — Save the scaffold

Determine the save path:

```
factory-output/output-prompts/{task-name-slug}.md
```

Where `{task-name-slug}` is the task name provided by the user, lowercased with spaces replaced by hyphens (e.g. "Closing Date Check" → `closing-date-check.md`).

Write the generated skeleton (with placeholders still in place) to that path, and open the file so the user can follow along. Then proceed immediately to Step 4 — do not stop and wait for manual editing.

---

## Step 4 — Interview the user to fill in every placeholder

The scaffold contains placeholders that represent **business decisions only the user can make** — never invent them. Walk the scaffold step by step and ask one targeted question per placeholder, then combine them all into **one** numbered-list message grouped by step.

Ask a question for each of the following placeholder types:

| Step type | What to ask |
|-----------|-------------|
| Each `CHECK [X]` step | 1) What is the exact condition the agent should check? 2) What should the FAIL finding say when the condition is not met? |
| Each `COMPARE` step (if present) | 1) Which two values are compared and what counts as a match? 2) What should the FAIL finding say on a mismatch? |
| `DECISION` step | When any check is tracked as FAIL, should the agent **escalate** (and with what exact reason?) or **`Do not complete the task.`**? |

Number the questions and label each with the step it belongs to. For example, for the signature/date scaffold:

> 1. **Step 2 (Check Signatures)** — What exact condition should the agent check (e.g. "all required borrower and seller signatures are present")? And what should the FAIL message say if it's not met?
> 2. **Step 3 (Check Dates)** — What exact condition should the agent check (e.g. "the disbursement date is on or after the signing date")? And what should the FAIL message say if it's not met?
> 3. **Step 5 (Decision)** — If any check FAILs, should the agent escalate (with what reason) or not complete the task?

Ask every placeholder question in this single message. Wait for the user's complete response before proceeding.

---

## Step 5 — Fill in the scaffold and save

Using the user's answers:

1. Replace every `[specify criteria]`, `[condition is not met]`, `[condition is met]`, `[summarize the finding]`, `[reason]`, and the bracketed `[Escalate ... / Do not complete the task.]` choice with the user's exact decisions.
2. Apply the structural rules from `../prompt-score/SKILL.md` (canonical ruleset) — do not invent any branch outcome, escalation, or terminal the user did not provide. If an answer is missing or ambiguous, ask a brief follow-up rather than guessing.
3. Overwrite the file at `factory-output/output-prompts/{task-name-slug}.md` with the filled-in prompt and confirm:

> Filled-in prompt saved to `factory-output/output-prompts/{task-name-slug}.md`.

---

## Step 6 — Hand off to Branch A

Return to `../prompt-factory-v2/SKILL.md` and continue Branch A from **Step A2 (Evaluate once)** using the filled-in file as the prompt input. Because placeholders are already resolved, evaluation should pass on the fast path or need only mechanical fixes.

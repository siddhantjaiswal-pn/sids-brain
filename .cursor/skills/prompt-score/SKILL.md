---
name: prompt-score
description: >-
  Canonical source of all Vesta agent prompt writing rules (R1–R7, M1–M6, action
  vocabulary, structure rules) AND the evaluator that scores a prompt against
  them. Produces one unified scorecard with a Status (PASS/WARN/FAIL) and a 0–10
  Score per dimension, plus a flagged-issues list. Use when the user says
  "prompt-score", "score this prompt", "grade this task", "rate my prompt",
  "prompt guardrails", "check guardrails", "audit this prompt", "check my prompt
  against the rules", or provides a .md file and wants it validated or scored
  against Vesta writing standards.
---

# Prompt Score

> **Canonical source.** Built from the Vesta Agent Task Instruction Writing
> Guide (March 2026). This is the single source of truth for both the writing
> rules and the quality score. Other skills reference this file and apply its
> rules verbatim — they do not duplicate or paraphrase them.

This skill is the canonical ruleset **and** the evaluator. It scores a Vesta
agent task prompt across **13 guardrail dimensions** on a **0–10 scale** and
reports a **PASS/WARN/FAIL** status per dimension in one unified scorecard.

---

## How the Agent Works — Foundational Facts

These facts underpin every rule below. Keep them in mind when evaluating any prompt.

1. **One task at a time.** The agent has no memory of previous tasks and cannot see future ones. Every task must be fully self-contained.
2. **Tools, not judgment.** The agent only does what is explicitly written. It will not infer steps that are missing.
3. **Finishes with a status.** The agent reports one of: `completed`, `unable to complete`, `blocked`, or `escalated`. **Default convention:** the happy path always ends with `finish with status=completed`; the unhappy path always ends with `Do not complete the task.` — unless the prompt explicitly specifies an escalation or other terminal. Never leave a path without an explicit terminal instruction.
4. **Two distinct data sources.** Structured loan data (borrower info, liabilities, assets, etc.) and uploaded documents (credit reports, pay stubs, bank statements, etc.) are different. The agent will not cross between them unless told to.

---

## Core Rules

These 6 rules apply to every Vesta agent task prompt without exception.

| # | Rule | Requirement |
|---|------|-------------|
| R1 | **Self-contained** | No step may reference what a previous task found or decided. If the agent needs information, it must look it up directly from loan data or documents. |
| R2 | **Explicit actions** | Every step must name the action, field, or document clearly enough that it's unambiguous what is meant. Use natural language field references (e.g., "Closing Date", "Borrower's Monthly Income") — the Vesta agent's search function will resolve them. No implied or ambiguous actions. Use the Action Vocabulary below. |
| R3 | **Clear If/Then logic** | Every conditional must define specific criteria and a named action for each branch. No open-ended instructions like "use your best judgment." |
| R4 | **Explicit escalation** | Escalation does not happen automatically. When escalation is the intended outcome for a failure or human-review case, the instruction must include the trigger condition and a stated reason. If escalation is not specified, the unhappy path must terminate with `Do not complete the task.` — never leave an unhappy path without a terminal. |
| R5 | **Specify data source** | Distinguish loan data fields from uploaded documents. Document references must be prefixed with "document" (e.g., "Review the Credit Report document", "Check if W-2 document is uploaded"). Never assume the agent will open a document when you only reference loan data. |
| R6 | **Define done** | Every path must end with an explicit terminal. **Happy path default:** `finish with status=completed`. **Unhappy path default:** `Do not complete the task.` (preceded by a note). Escalation is valid only when the prompt explicitly calls for it. |
| R7 | **No UI references** | The agent has no access to the Vesta UI. No step may reference navigating a screen, clicking a button, selecting from a dropdown, or interacting with any interface element. Rewrite as an explicit data lookup or document review. |

---

## Action Vocabulary

Use these exact phrasings. Non-canonical phrasings are a scoring defect. For field names, use clear natural language (e.g., "Closing Date", "Borrower's Monthly Income") — the Vesta agent's search function will resolve them to the correct technical field names.

| Action | Canonical phrasing |
|--------|--------------------|
| Write a loan field | `Set [field] to [value]` — e.g., "Set Closing Date to [value]", "Set Borrower's Monthly Income to [value]" |
| Leave a note | `Write a note stating [message]` |
| Escalate | `Escalate the objective with the reason '[reason]'` |
| Block | `Block the objective for [duration/condition]` |
| Review a document | `Review the [document type] document` or `Get the [document type] document` — e.g., "Review the Credit Report document", "Get the W-2 document" |
| Run validations | `Run get_loan_validations and check for [specific validations]` |
| Call an integration | `Order [service]` or `Run [integration name]` |
| Make a UW decision | `Set loan decision to [decision]` |
| Read loan data | `Use search_loan_data_model to get [field/entity]` — e.g., "Use search_loan_data_model to get Closing Date", "Use search_loan_data_model to get Borrower's Employment History" |
| List objectives | `Use list_objectives to find [objective name]` |
| Accept a document | `Mark the [document type] document as Accepted` — e.g., "Mark the Credit Report document as Accepted" |
| Complete the task | `finish with status=completed` |
| Do not complete the task | `Do not complete the task.` — valid terminal step when the prompt intentionally leaves the task open; must be preceded by a `Write a note stating [reason]` |

---

## Instruction Structure Rules

Well-structured prompts break work into labeled steps. Each step must answer all three questions:

1. **What should the agent check or do?** (e.g., "Review the Credit Report document" or "Run get_loan_validations")
2. **What is the agent looking for?** (e.g., "Check for tradelines with 60+ days past due")
3. **What should it do with the result?** (e.g., "If found, escalate. If not, proceed to the next step.")

**Formatting requirements:**
- Use uppercase labels for step names (e.g., `STEP 1: GATHER KEY DATA`, `STEP 2: CHECK TITLE STATUS`)
- Write conditional logic as: `IF [condition]: [action]. IF NOT [condition]: [action].`
- Every `IF` must have a corresponding outcome for the negative case — no unhandled branches
- Every path must terminate with an explicit terminal. **Happy path:** `finish with status=completed`. **Unhappy path:** `Do not complete the task.` (always preceded by a `Write a note stating [reason]`). Escalation is only used when the prompt explicitly calls for it.
- The **second-to-last step** of every prompt must be a dedicated notes step: `Write a note stating all findings, values checked, decisions made, and reasons for any actions taken in the preceding steps.` This step must appear before any terminal (completion, escalation, or do-not-complete).

---

## Common Mistakes

| # | Mistake | Description |
|---|---------|-------------|
| M1 | **Cross-task reference** | Writing instructions that reference what a prior task found or decided. The agent starts fresh on every task. |
| M2 | **Vague instructions** | Using instructions like "review the loan" or "make sure everything looks right." The agent needs specific fields, documents, and criteria. |
| M3 | **Missing escalation path** | If the prompt intends escalation for a failure or gap case but omits the escalation instruction, that is a defect. However, not every unhappy path requires escalation — if escalation is not specified, `Do not complete the task.` is the correct default terminal. |
| M4 | **Human communication** | Asking the agent to send emails, make calls, or contact borrowers/realtors. The agent cannot communicate with people. Rewrite as: gather the data → escalate to a human. |
| M5 | **Unspecified document** | Saying "check credit" when you mean "review the credit report." Loan data fields and uploaded documents are different — name the document explicitly. |
| M6 | **Missing notes step** | Ending the task without a dedicated notes step before the terminal. Every prompt must include an explicit step to write detailed notes covering all findings, values, decisions, and reasons from the preceding steps. |

---

## Anti-Pattern Examples

### M1 — Cross-task reference
- ❌ `"If the credit review found issues, escalate this objective."`
- ✅ `"Review the Credit Report document. If any tradeline shows 60+ days past due in the last 12 months, escalate the objective with the reason 'Derogatory tradeline found.' Otherwise, finish with status=completed."`

### M2 — Vague instruction
- ❌ `"Make sure the borrower's income is right."`
- ✅ `"Review the Pay Stub document and W-2 document. Compare the borrower's monthly income on the documents to the Monthly Income field on the loan. If they don't match, set Monthly Income to the lesser of the two. Write a note summarizing what was changed and why."`

### M3 — Missing escalation path
- ❌ `"Verify employment history covers the last 2 years."`
- ✅ `"Verify the borrower's employment history covers at least 2 continuous years. If there is a gap longer than 30 days, escalate the objective with the reason 'Employment gap exceeds 30 days — manual review required.' If history is complete, finish with status=completed."`

### M4 — Human communication
- ❌ `"Notify the borrower of missing documents."`
- ✅ `"Write a note listing the missing documents and escalate the objective with the reason 'Missing documents require borrower follow-up.'"`

### M5 — Unspecified document
- ❌ `"Check if the borrower's assets are sufficient for closing."`
- ✅ `"Review the Bank Statement document. Compare the account balances on the Bank Statement document to the Asset amounts on the loan. If any asset on the loan does not have a matching Bank Statement document, write a note listing the unverified assets and escalate the objective."`

### R7 — UI reference
- ❌ `"Select the loan purpose from the dropdown."` / `"Navigate to the income section and enter the value."` / `"Click Save on the screen."`
- ✅ `"Use search_loan_data_model to get Loan Purpose."` / `"Set Monthly Income to [value]."`

### Unhandled branch
- ❌ `"If the loan amount exceeds the limit, escalate."` *(no else)*
- ✅ `"If the loan amount exceeds the limit => Escalate the objective with the reason '[reason]'. If within the limit => proceed to the next step."`

### M6 — Missing notes step
- ❌ A prompt whose final step is `finish with status=completed` with no notes step before it.
- ✅ `"STEP N: NOTES — Write a note stating all findings, values reviewed, decisions made, and reasons for any actions taken in the preceding steps."`

---

## Scoring Dimensions

The 13 dimensions map one-to-one to the Core Rules and Common Mistakes above.

| # | Dimension | What is evaluated |
|---|-----------|-------------------|
| R1 | Self-contained | No step assumes knowledge from a prior task — all needed data is looked up directly |
| R2 | Explicit actions | Every step names the action, field, or document clearly enough that it's unambiguous what is meant — uses natural language field references (e.g., "Closing Date", "Borrower's Monthly Income") that the Vesta agent's search function can resolve |
| R3 | If/Then logic | Every conditional has specific criteria and a named outcome for each branch — no unhandled branches |
| R4 | Explicit escalation | Every failure or gap case includes either: (a) a trigger condition and stated reason for escalation, OR (b) an explicit `Do not complete the task.` instruction preceded by a note — never an implicit or absent terminal |
| R5 | Data source specified | Loan data fields and uploaded documents are always distinguished — never conflated. Document references must be prefixed with "document" (e.g., "Credit Report document", "W-2 document") |
| R6 | Completion defined | Every path ends with a clear `status=completed`, an escalation, or an explicit `Do not complete the task.` instruction (always preceded by a `Write a note stating [reason]`) — no dangling paths |
| R7 | No UI references | No step references screens, buttons, dropdowns, or navigation — rewritten as data lookups |
| M1 | No cross-task references | No step references what another task found or decided |
| M2 | No vague instructions | No open-ended language like "make sure", "review the loan", or "ensure it's correct" |
| M3 | Escalation path exists | All situations the agent cannot resolve have an explicit resolution — either an escalation with trigger and reason, OR an explicit `Do not complete the task.` preceded by a note. Never left open or ambiguous. |
| M4 | No human communication | No instruction to email, call, notify, or contact any person |
| M5 | Documents named explicitly | All document references use the full type name with "document" suffix (e.g., "Credit Report document", "Bank Statement document", "W-2 document") |
| M6 | Notes step present | A dedicated notes step appears immediately before every terminal, instructing the agent to write all findings, values, decisions, and reasons from the preceding steps |

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

## Status Band (Pass Bar)

Every dimension also carries a status derived directly from its score. The pass bar is **8.5**.

| Status | Score range | Meaning |
|--------|-------------|---------|
| **PASS** | ≥ 8.5 | Meets the quality bar |
| **WARN** | 7 – 8.4 | Close, but below bar — needs a small fix |
| **FAIL** | < 7 | Clear violation — must be fixed |

A prompt is **production-ready only when all 13 dimensions are PASS (≥ 8.5)**. This same bar is used by `prompt-factory-v2`.

---

## Pre-Save Checklist

When validating a prompt, confirm all 9 items pass:

- [ ] **Self-contained?** Could the agent complete this task without knowing what any other task did?
- [ ] **Actions explicit?** Are specific tools or actions named (e.g., `write_loan`, `escalate`, `review the credit report`)?
- [ ] **Conditions clear?** Is every IF/THEN decision written with specific criteria and a named action for each branch?
- [ ] **Escalation path exists?** If something unexpected happens, does the agent know when and how to escalate?
- [ ] **Documents named?** If the task involves document verification, are the document types explicitly named?
- [ ] **Completion defined?** Does every path end with an explicit terminal? Happy path = `finish with status=completed`. Unhappy path = `Do not complete the task.` preceded by a note. Escalation only when explicitly called for.
- [ ] **Notes step present?** Is there a dedicated step immediately before each terminal that instructs the agent to write detailed notes covering all findings, values, decisions, and reasons from the preceding steps?
- [ ] **No human communication?** The agent cannot send emails, make calls, or contact any party.
- [ ] **No cross-task references?** No step references another task's results — if data is needed, the agent must look it up itself.

---

## Workflow

### Step 1 — Locate the file

- If the user provides a `.md` path, use it.
- If no path is given, ask: "Please provide the path to the prompt file you want scored."

### Step 2 — Read the file

Read the full contents. Note labeled steps, conditional logic, escalation paths, and completion states.

**Document type check:** For every document referenced in the prompt, confirm its exact document type name against `./vesta-doc-types.md`. If any document is referenced by a generic or informal name (e.g., "the doc", "the form", "the report"), flag it as an issue and — when scoring on behalf of a fix — ask the user: "What is the exact document type name for '[informal name]' as it appears in Vesta?"

### Step 3 — Score each dimension

For each of the 13 dimensions, assign a score 0–10 with a one-line finding, then derive its status from the Status Band (PASS ≥ 8.5, WARN 7–8.4, FAIL < 7). Cite the specific step and quote offending text for any score below 7.

### Step 4 — Render the unified scorecard

Output in this exact format. The single table carries both the qualitative status and the number, so no separate audit table is needed:

```
File: {relative path}

--- Prompt Score ---

| Dimension                  | Status | Score | Finding                              |
|----------------------------|--------|-------|--------------------------------------|
| R1  Self-contained         |        |  /10  |                                      |
| R2  Explicit actions       |        |  /10  |                                      |
| R3  If/Then logic          |        |  /10  |                                      |
| R4  Explicit escalation    |        |  /10  |                                      |
| R5  Data source specified  |        |  /10  |                                      |
| R6  Completion defined     |        |  /10  |                                      |
| R7  No UI references        |        |  /10  |                                      |
| M1  No cross-task refs     |        |  /10  |                                      |
| M2  No vague instructions  |        |  /10  |                                      |
| M3  Escalation path        |        |  /10  |                                      |
| M4  No human comms         |        |  /10  |                                      |
| M5  Documents named        |        |  /10  |                                      |
| M6  Notes step present     |        |  /10  |                                      |

Overall: XX / 130   |   Below bar (<8.5): {comma-separated dimension codes, or "none"}

--- Flagged Issues ---
[R3] Step N — "{quoted text}" — unhandled branch, no negative case defined.
[M2] Step N — "{quoted text}" — vague, no specific field or criteria named.
[R7] Step N — "{quoted text}" — references a UI element; rewrite as a data lookup.
```

The Status column must read `PASS`, `WARN`, or `FAIL` per the Status Band. If no issues, replace the Flagged Issues section with: `No issues found.`

### Step 5 — Offer next steps

After the scorecard, always offer:

> - Say **"fix"** to apply corrections to all flagged issues.
> - Say **"checklist"** to walk through the 9-item pre-save checklist interactively.
> - Or tell me which specific steps to update.

Do NOT apply fixes unless the user says "fix." When fixing, never invent branch outcomes, escalation triggers/reasons, or terminal choices — ask the user for those.

---

## Document Types Reference

All valid Vesta document type names are listed in `./vesta-doc-types.md`. Document references in prompts must use the exact name from that list followed by " document" (e.g., "Review the Credit Report document").

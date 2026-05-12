---
name: prompt-guardrails
description: >-
  Canonical source of all Vesta agent prompt writing rules derived from the
  Vesta Agent Task Instruction Writing Guide. Checks a prompt file against 6
  core principles, 5 common mistakes, action vocabulary, and structure rules,
  then outputs a pass/fail audit report. Other skills read this file to apply
  consistent guardrails. Use when the user says "prompt guardrails", "check
  guardrails", "audit this prompt", "check my prompt against the rules", or
  provides a .md file and wants it validated against Vesta writing standards.
---

# Vesta Prompt Guardrails

> **Canonical source.** Built from the Vesta Agent Task Instruction Writing
> Guide (March 2026). Do not duplicate or paraphrase these rules in other skill
> files — reference this file and apply verbatim.

---

## How the Agent Works — Foundational Facts

These facts underpin every rule below. Keep them in mind when auditing any prompt.

1. **One task at a time.** The agent has no memory of previous tasks and cannot see future ones. Every task must be fully self-contained.
2. **Tools, not judgment.** The agent only does what is explicitly written. It will not infer steps that are missing.
3. **Finishes with a status.** The agent reports one of: `completed`, `unable to complete`, `blocked`, or `escalated`. If you want a specific status, you must say so. A step may also explicitly instruct the agent to **not complete the task** — this is a valid terminal state when the prompt intentionally leaves the task open (e.g., a prerequisite data condition was not met). The instruction must be explicit: `Do not complete the task.`
4. **Two distinct data sources.** Structured loan data (borrower info, liabilities, assets, etc.) and uploaded documents (credit reports, pay stubs, bank statements, etc.) are different. The agent will not cross between them unless told to.

---

## Core Rules

These 6 rules apply to every Vesta agent task prompt without exception.

| # | Rule | Requirement |
|---|------|-------------|
| R1 | **Self-contained** | No step may reference what a previous task found or decided. If the agent needs information, it must look it up directly from loan data or documents. |
| R2 | **Explicit actions** | Every step must name the action, field, or document clearly enough that it's unambiguous what is meant. Use natural language field references (e.g., "Closing Date", "Borrower's Monthly Income") — the Vesta agent's search function will resolve them. No implied or ambiguous actions. Use the Action Vocabulary below. |
| R3 | **Clear If/Then logic** | Every conditional must define specific criteria and a named action for each branch. No open-ended instructions like "use your best judgment." |
| R4 | **Explicit escalation** | Escalation does not happen automatically. Every failure, gap, or human-review case must include an explicit escalation instruction with the trigger condition and a stated reason. |
| R5 | **Specify data source** | Distinguish loan data fields from uploaded documents. If the task involves a document, name it explicitly (e.g., "Review the credit report"). Never assume the agent will open a document when you only say "check credit." |
| R6 | **Define done** | Every path must end with a clear completion status, an escalation, or an explicit `Do not complete the task.` instruction. The agent must know what "done" looks like for every possible outcome. |
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
| Review a document | `Review the [document type]` or `Get the [document]` |
| Run validations | `Run get_loan_validations and check for [specific validations]` |
| Call an integration | `Order [service]` or `Run [integration name]` |
| Make a UW decision | `Set loan decision to [decision]` |
| Read loan data | `Use search_loan_data_model to get [field/entity]` — e.g., "Use search_loan_data_model to get Closing Date", "Use search_loan_data_model to get Borrower's Employment History" |
| List objectives | `Use list_objectives to find [objective name]` |
| Accept a document | `Mark the [document type] as Accepted` |
| Complete the task | `finish with status=completed` |
| Do not complete the task | `Do not complete the task.` — valid terminal step when the prompt intentionally leaves the task open; must be preceded by a `Write a note stating [reason]` |

---

## Instruction Structure Rules

Well-structured prompts break work into labeled steps. Each step must answer all three questions:

1. **What should the agent check or do?** (e.g., "Review the credit report" or "Run get_loan_validations")
2. **What is the agent looking for?** (e.g., "Check for tradelines with 60+ days past due")
3. **What should it do with the result?** (e.g., "If found, escalate. If not, proceed to the next step.")

**Formatting requirements:**
- Use uppercase labels for step names (e.g., `STEP 1: GATHER KEY DATA`, `STEP 2: CHECK TITLE STATUS`)
- Write conditional logic as: `IF [condition]: [action]. IF NOT [condition]: [action].`
- Every `IF` must have a corresponding outcome for the negative case — no unhandled branches
- Every path must terminate in a completion status, an escalation, or an explicit `Do not complete the task.` instruction (always preceded by a `Write a note stating [reason]`)

---

## Common Mistakes

| # | Mistake | Description |
|---|---------|-------------|
| M1 | **Cross-task reference** | Writing instructions that reference what a prior task found or decided. The agent starts fresh on every task. |
| M2 | **Vague instructions** | Using instructions like "review the loan" or "make sure everything looks right." The agent needs specific fields, documents, and criteria. |
| M3 | **Missing escalation path** | If a task can encounter a situation the agent can't resolve, it needs an explicit escalation. Without it the agent may report "unable to complete" with no routing. |
| M4 | **Human communication** | Asking the agent to send emails, make calls, or contact borrowers/realtors. The agent cannot communicate with people. Rewrite as: gather the data → escalate to a human. |
| M5 | **Unspecified document** | Saying "check credit" when you mean "review the credit report." Loan data fields and uploaded documents are different — name the document explicitly. |

---

## Anti-Pattern Examples

### M1 — Cross-task reference
- ❌ `"If the credit review found issues, escalate this objective."`
- ✅ `"Review the credit report. If any tradeline shows 60+ days past due in the last 12 months, escalate the objective with the reason 'Derogatory tradeline found.' Otherwise, finish with status=completed."`

### M2 — Vague instruction
- ❌ `"Make sure the borrower's income is right."`
- ✅ `"Review the pay stubs and W-2s. Compare the borrower's monthly income on the documents to the Monthly Income field on the loan. If they don't match, set Monthly Income to the lesser of the two. Write a note summarizing what was changed and why."`

### M3 — Missing escalation path
- ❌ `"Verify employment history covers the last 2 years."`
- ✅ `"Verify the borrower's employment history covers at least 2 continuous years. If there is a gap longer than 30 days, escalate the objective with the reason 'Employment gap exceeds 30 days — manual review required.' If history is complete, finish with status=completed."`

### M4 — Human communication
- ❌ `"Notify the borrower of missing documents."`
- ✅ `"Write a note listing the missing documents and escalate the objective with the reason 'Missing documents require borrower follow-up.'"`

### M5 — Unspecified document
- ❌ `"Check if the borrower's assets are sufficient for closing."`
- ✅ `"Review the borrower's bank statements. Compare the account balances on the statements to the Asset amounts on the loan. If any asset on the loan does not have a matching bank statement, write a note listing the unverified assets and escalate the objective."`

### R7 — UI reference
- ❌ `"Select the loan purpose from the dropdown."` / `"Navigate to the income section and enter the value."` / `"Click Save on the screen."`
- ✅ `"Use search_loan_data_model to get Loan Purpose."` / `"Set Monthly Income to [value]."`

### Unhandled branch
- ❌ `"If the loan amount exceeds the limit, escalate."` *(no else)*
- ✅ `"If the loan amount exceeds the limit => Escalate the objective with the reason '[reason]'. If within the limit => proceed to the next step."`

---

## Pre-Save Checklist

When validating a prompt, confirm all 8 items pass:

- [ ] **Self-contained?** Could the agent complete this task without knowing what any other task did?
- [ ] **Actions explicit?** Are specific tools or actions named (e.g., `write_loan`, `escalate`, `review the credit report`)?
- [ ] **Conditions clear?** Is every IF/THEN decision written with specific criteria and a named action for each branch?
- [ ] **Escalation path exists?** If something unexpected happens, does the agent know when and how to escalate?
- [ ] **Documents named?** If the task involves document verification, are the document types explicitly named?
- [ ] **Completion defined?** Does the agent know what "done" looks like for every possible outcome? (Acceptable terminals: `finish with status=completed`, an escalation, or `Do not complete the task.` preceded by a note.)
- [ ] **No human communication?** The agent cannot send emails, make calls, or contact any party.
- [ ] **No cross-task references?** No step references another task's results — if data is needed, the agent must look it up itself.

---

## Guardrail Audit Workflow

When invoked directly ("prompt guardrails", "check guardrails", "audit this prompt", etc.), run this workflow:

### Step 1 — Locate the file

- If the user provides a `.md` file path, use it.
- If no path is given, ask: "Please provide the path to the prompt file you want audited."

### Step 2 — Read the file

Read the full contents. Note the number of labeled steps and whether each step is structured with a clear action, lookup target, and result handling.

**Document type check:** For every document referenced in the prompt, confirm you know its exact document type name as it appears in Vesta (e.g., "1003 URLA", "Closing Disclosure", "Note"). If any document is referenced by a generic or informal name (e.g., "the doc", "the form", "the report"), stop and ask the user:

> "What is the exact document type name for '[informal name]' as it appears in Vesta?"

Do not proceed to Step 3 until all document type names are confirmed.

### Step 3 — Check every rule and mistake

For each Core Rule (R1–R6) and Common Mistake (M1–M5), scan every step and mark **PASS**, **WARN**, or **FAIL**.

| Status | Meaning |
|--------|---------|
| PASS | Rule is fully satisfied across the entire prompt |
| WARN | Possible violation — may be ambiguous or partially addressed |
| FAIL | Clear violation — cite the step and quote the offending text |

### Step 4 — Render the audit report

Output in this exact format:

```
File: {relative path}

--- Guardrail Audit ---

| Check | Status | Finding |
|-------|--------|---------|
| R1  Self-contained        | PASS/WARN/FAIL | {one-line finding or "OK"} |
| R2  Explicit actions      | PASS/WARN/FAIL | {one-line finding or "OK"} |
| R3  Clear If/Then logic   | PASS/WARN/FAIL | {one-line finding or "OK"} |
| R4  Explicit escalation   | PASS/WARN/FAIL | {one-line finding or "OK"} |
| R5  Data source specified | PASS/WARN/FAIL | {one-line finding or "OK"} |
| R6  Completion defined    | PASS/WARN/FAIL | {one-line finding or "OK"} |
| M1  No cross-task refs    | PASS/WARN/FAIL | {one-line finding or "OK"} |
| M2  No vague instructions | PASS/WARN/FAIL | {one-line finding or "OK"} |
| M3  Escalation path       | PASS/WARN/FAIL | {one-line finding or "OK"} |
| M4  No human comms        | PASS/WARN/FAIL | {one-line finding or "OK"} |
| M5  Documents named       | PASS/WARN/FAIL | {one-line finding or "OK"} |
| R7  No UI references      | PASS/WARN/FAIL | {one-line finding or "OK"} |

Failures: N  |  Warnings: N  |  Passes: N

--- Violations ---
[R3] Step N — "{quoted text}" has an unhandled branch — no action defined for the negative case.
[M4] Step N — "{quoted text}" asks the agent to communicate with a person.
[M2] Step N — "{quoted text}" is too vague — no specific field, document, or criteria named.
```

If there are no violations, replace the Violations section with: `No violations found.`

### Step 5 — Offer next steps

After the report, always offer:

> - Say **"fix"** to apply corrections to all violations.
> - Say **"checklist"** to walk through the 8-item pre-save checklist interactively.
> - Or tell me which specific steps to update.

Do NOT apply any fixes here — this skill is audit-only unless the user says "fix."

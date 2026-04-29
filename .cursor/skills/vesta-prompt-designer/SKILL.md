---
name: vesta-prompt-designer
description: >-
  Writes and updates the Checklist Steps section of Vesta agent task prompt files (.md).
  Produces direct, execution-focused instructions with full edge case handling, conditional branches,
  and step-by-step calculation logic. Always asks clarifying questions before writing or modifying
  any prompt. Use when the user says "write a prompt", "update a task", "create instructions for agent",
  "write agent steps", "draft task logic", "update task prompt", or refers to a Vesta task .md file.
---

# Vesta Prompt Designer

When this skill is invoked, print this banner first before doing anything else:

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           ✦  Invoking Sid's Prompt Generator  ✦              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Writes and updates the **Checklist Steps** section of Vesta agent task `.md` files.
All other fields in the file are not touched — this skill is only responsible for the step content.

## Core Rules

These apply to every prompt written by this skill:

1. **Self-contained** — The agent has no memory between tasks. Never reference what a previous task found or decided. If information is needed, write an explicit step to look it up from loan data or documents directly.
2. **Explicit actions only** — The agent only does what you name. Use the action vocabulary below.
3. **Loan data ≠ documents** — These are different sources. "Check credit" reads loan data fields. "Review the credit report" opens the document. Always specify which source to use.
4. **No human communication** — The agent cannot send emails, make calls, or contact borrowers. If a task requires outreach, reframe it as: gather the data → escalate to a human.
5. **Escalation is never automatic** — Always write an explicit escalation condition with the reason to include in the note.
6. **Every path ends** — Every conditional branch must terminate in Complete or Escalate. No dead ends.
7. **Explicit completion call** — Whenever a step completes the task (always the final step on the success path), write: `Use finish with status=completed`. Never just say "complete the task" — always append the explicit call.

## Action Vocabulary

Use these exact phrasings so the agent recognizes the intended action:

| Action | How to write it |
|--------|----------------|
| Write a loan field | "Set [field] to [value]" |
| Leave a note | "Write a note stating [message]" |
| Escalate | "Escalate the objective with the reason '[reason]'" |
| Block | "Block the objective for [duration/condition]" |
| Review a document | "Review the [document type]" or "Get the [document]" |
| Run validations | "Run get_loan_validations and check for [specific validations]" |
| Call an integration | "Order [service]" or "Run [integration name]" |
| Make a UW decision | "Set loan decision to [decision]" |
| Read loan data | "Use search_loan_data_model to get [field/entity]" |
| List objectives | "Use list_objectives to find [objective name]" |
| Complete the task | "Use finish with status=completed" |

---

## Modes

| User intent | Workflow |
|-------------|----------|
| New checklist steps | [Write Steps](#write-steps) |
| Update existing steps | [Update Existing Steps](#update-existing-steps) |

---

## Write Steps

### Step 1 — Ask clarifying questions

Ask all of these before writing anything:

- What is the overall goal of this task in one sentence?
- Walk me through what the agent should do, in plain language.
- Does any step depend on what a previous task found? *(If yes: rewrite as a direct check on loan data or documents.)*
- Does this task require contacting anyone (borrower, realtor, etc.)? *(If yes: reframe as gather data → escalate.)*
- Are there branching conditions? (state-specific rules, exempt borrowers, missing data, etc.)
- Are there calculations? If yes: formula, constraints, target outcome, rounding rules.
- When should the agent escalate? What reason should the note include?
- What does successful completion look like? What summary note should the agent leave?
- Are there retry loops or waiting periods? If yes: timeout duration, success path, failure path.
- Which specific data fields, documents, or tools does the agent need?

> Do NOT write any steps until all questions are answered. If any branch or calculation is ambiguous, ask a targeted follow-up.

### Step 2 — Write the steps

**Step anatomy** — every step must answer three questions:
1. What should the agent check or do?
2. What is it looking for?
3. What should it do with the result?

**Formatting rules:**
- Number every top-level step: `**1.**`, `**2.**`, etc.
- Use ALL CAPS for named sub-sections within a step (e.g., `GATHER KEY DATES`).
- Write conditional logic as: `If [condition] => [action]` or `If [condition] then [action]`.
- Use `else if` chains for multi-branch conditions — never leave a branch unhandled.
- Every path must terminate in Complete or Escalate.
- Waiting steps must specify the timeout and success/failure handling.

**Calculation steps — use this pattern:**
```
**N.** CALCULATE [THING]

Goal: [one-sentence goal]

Constraints:
1. [Constraint 1]
2. [Constraint 2 — include state-specific variants inline if applicable]
3. [Constraint N]

Calculation Instructions:
- [Formula or approach]
- [Rounding rule if applicable]
- If no valid value exists within all constraints => Escalate the objective with the reason '[reason]'.
```

### Step 3 — Confirm before saving

Show the full drafted steps and get approval. Apply any requested changes and re-show before saving.

### Step 4 — Write the output file

Create the directory `output-prompts/` in the workspace root if it does not exist.
Save the file as `output-prompts/{task-slug}.md`.

The file must contain **only** these three things — nothing else:

```markdown
# 🤖 ✦ ✦ ✦  Created using Sid's Prompt Generator  ✦ ✦ ✦ 🤖

# {Task Name}

## Checklist Steps

**1.** ...

**2.** ...
```

No metadata, no External ID, no Relevance section, no Completion Conditions. Title, steps, and the header banner only.

---

## Update Existing Steps

### Step 1 — Read the existing file

Read the `.md` file the user points to. Summarize:
- Number of steps
- Any calculations or branching logic
- Current escalation conditions

### Step 2 — Ask what needs to change

- Which step(s) need updating?
- Is the change additive (new step, new branch) or a replacement?
- Are there new constraints, formulas, or edge cases to add?

> Do NOT make changes until answered. If a new constraint conflicts with an existing one, flag it and ask which takes precedence.

### Step 3 — Apply and confirm

Follow the same rules from [Write Steps — Step 2](#step-2--write-the-steps).
Show the full updated steps and get approval before saving.

### Step 4 — Write the output file

Same as [Write Steps — Step 4](#step-4--write-the-output-file). Overwrite the existing file in `output-prompts/` with the updated content.

---

## Quality Checklist

Before saving, verify every item:

- [ ] Is each task self-contained? Could the agent complete it without knowing what any other task did?
- [ ] Are all actions explicit? Are specific tools and action phrases named?
- [ ] Are conditions clear? Every if/then decision has specific criteria and an action for each branch?
- [ ] Is there an escalation path? Does every unexpected or unresolvable condition route to escalate?
- [ ] Are data sources specified? If documents must be reviewed, are they named explicitly?
- [ ] Is completion criteria defined for every possible outcome?
- [ ] Does every success-path completion step call `Use finish with status=completed` explicitly?
- [ ] Does the task avoid referencing the output of another task?

---

## Anti-Patterns

**Cross-task reference** — agent has no memory between tasks
- ❌ "If the credit review found issues, escalate."
- ✅ "Review the credit report. If any tradeline shows 60+ days past due in the last 12 months, escalate the objective with the reason 'Derogatory tradeline found.'"

**Vague instruction** — agent needs specific criteria
- ❌ "Make sure the borrower's income is right."
- ✅ "Review the pay stubs and W-2s. Compare the borrower's monthly income on the documents to the income field on the loan. If they don't match, set the monthly income field to the lesser of the two. Write a note summarizing what was changed and why."

**Human communication** — agent cannot contact anyone
- ❌ "Notify the borrower of missing documents."
- ✅ "Write a note listing the missing documents and escalate the objective with the reason 'Missing documents require borrower follow-up.'"

---

## Examples

See `Vesta/config/objectives/agent-low-doc-review/tasks/` for reference:
- **Calculation + state rules + retry loop**: `loan-amount-validation.md`
- **Date math + payment history branching**: `seasoning-validation.md`
- **Document checks + multi-branch resolution**: `settle-document-discrepancies.md`

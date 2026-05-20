---
name: prompt-factory-v2
description: Orchestrates the full Vesta prompt lifecycle for creating or improving agent task prompts. Branch A (new prompt): collects a raw prompt, runs prompt-guardrails audit, asks clarifying questions based on findings, builds detailed instructions, scores with prompt-score, and saves when average score > 9.0 — iterates up to 3 times. Branch B (modify existing): runs prompt-guardrails on a provided prompt or .md file, rewrites to fix all violations, scores with prompt-score, saves when average > 9.0 — iterates up to 3 times. After 3 failed attempts, stops and lets the user decide. Use when the user says "prompt factory v2", "run prompt-factory-v2", "create a new vesta prompt", "improve this prompt", "modify this agent prompt", or "score and fix my prompt".
disable-model-invocation: false
---

# Prompt Factory v2

Orchestrator for creating and improving Vesta agent task prompts to production quality (average score > 9.0 / 10).

---

## On Invocation

Ask the user:

> Are you **creating a new prompt** from scratch, or **modifying an existing prompt**?

Then follow the matching branch below.

---

## Branch A — New Prompt

### Step 1 — Collect the prompt

Ask the user to provide their complete prompt. They can:

- Paste it inline in the chat, or
- Provide a `.md` file path (read the file)

### Step 2 — Run prompt-guardrails

Read and follow:
`../prompt-guardrails/SKILL.md`

Run the full guardrail audit on the collected prompt. Render the complete audit report (R1–R7, M1–M6 table + Violations section).

**Document name validation:** If any document is referenced in the prompt, read `../prompt-guardrails/vesta-doc-types.md` and verify that all document names match the exact names from the canonical list. Flag any mismatches in the audit report.

### Step 3 — Ask clarifying questions

Based on every FAIL and WARN in the audit report, ask the user targeted clarifying questions before rewriting. Combine all questions into one message. Examples:

- "Step 3 has an unhandled branch — what should the agent do if [condition] is not met?"
- "Step 5 references a document but doesn't name it — which document should the agent review here?"
- "The escalation is missing a reason — what reason should the agent state when escalating?"
- "This step implies the agent will know what a prior task found — where should it look up this data directly?"
- "You mentioned 'W-2' but the exact Vesta document name is '2024 W-2' — should I use the year-specific name or a generic reference?"

Wait for the user's full response before proceeding.

### Step 4 — Build the improved prompt

Using the original prompt, the guardrail findings, and all clarifying answers from Step 3:

1. Rewrite the prompt as fully detailed, step-by-step agent instructions
2. Apply all rules from `prompt-guardrails` (R1–R7, M1–M6, action vocabulary, step structure):
   - Every step must name the exact action, tool, field, or document
   - Use natural language for field names (e.g., "Closing Date", "Borrower's Monthly Income")
   - All document references must include " document" suffix and use exact names from `../prompt-guardrails/vesta-doc-types.md`
   - Every IF must have a defined outcome for both branches
   - Every path must end in `status=completed`, an explicit escalation, or `Do not complete the task.` (preceded by a note)
   - Include a dedicated notes step immediately before every terminal
   - Use canonical action vocabulary (Set, Write a note, Escalate, Review the, etc.)
   - No vague language, no UI references, no cross-task references
3. Label every step with uppercase headers (`STEP 1: ...`, `STEP 2: ...`)

Present the rewritten prompt to the user, then ask:

> Does this look correct? Reply **"confirm"** to proceed to scoring, or tell me what to change.

Apply any requested changes, then wait for confirmation before scoring.

### Step 5 — Score and save

Once confirmed, read and follow:
`../prompt-score/SKILL.md`

Run `prompt-score` on the confirmed prompt. Render the full scorecard.

Calculate: `average = total ÷ 13`

- **If average > 9.0** → determine the save path using the **Save Path Rules** below, write the file, and confirm the path to the user. Done.
- **If average ≤ 9.0** → enter the **Improvement Loop** below. This counts as attempt 1.

---

## Branch B — Modify Existing Prompt

### Step 1 — Collect the prompt

Ask the user to either:

- Paste the prompt inline, or
- Provide a `.md` file path (read the file)

### Step 2 — Run prompt-guardrails

Read and follow:
`../prompt-guardrails/SKILL.md`

Run the full guardrail audit on the prompt. Render the complete audit report.

**Document name validation:** If any document is referenced in the prompt, read `../prompt-guardrails/vesta-doc-types.md` and verify that all document names match the exact names from the canonical list. Flag any mismatches in the audit report.

### Step 3 — Ask clarifying questions

Based on every FAIL and WARN in the audit report, ask the user targeted clarifying questions before rewriting. Combine all questions into one message. Examples:

- "Step 3 has an unhandled branch — what should the agent do if [condition] is not met?"
- "Step 5 references a document but doesn't name it — which document should the agent review here?"
- "The escalation is missing a reason — what reason should the agent state when escalating?"
- "This step implies the agent will know what a prior task found — where should it look up this data directly?"
- "You mentioned 'W-2' but the exact Vesta document name is '2024 W-2' — should I use the year-specific name or a generic reference?"

Wait for the user's full response before proceeding.

### Step 4 — Rewrite based on findings and answers

Using the original prompt, the guardrail findings, and all clarifying answers from Step 3, apply fixes for all FAIL and WARN items:

- Add missing escalation paths with explicit trigger conditions and reasons
- Replace vague instructions with specific actions, fields, or documents
- Use natural language for field names (e.g., "Closing Date", not "closing_date")
- Ensure all document names match the exact names from `../prompt-guardrails/vesta-doc-types.md` and include " document" suffix
- Handle all unhandled IF branches
- Remove UI references — rewrite as data lookups
- Name all documents explicitly
- Ensure every path terminates in `status=completed`, an escalation, or `Do not complete the task.` (preceded by a note)
- Add a dedicated notes step immediately before every terminal
- Use canonical action vocabulary throughout

Present the rewritten prompt to the user, then ask:

> Does this look correct? Reply **"confirm"** to proceed to scoring, or tell me what to change.

Apply any requested changes, then wait for confirmation before scoring.

### Step 5 — Score and save

Read and follow:
`../prompt-score/SKILL.md`

Run `prompt-score` on the rewritten prompt. Render the full scorecard.

Calculate: `average = total ÷ 13`

- **If average > 9.0** → determine the save path using the **Save Path Rules** below, write the file, and confirm the path to the user. Done.
- **If average ≤ 9.0** → enter the **Improvement Loop** below. This counts as attempt 1.

---

## Improvement Loop

Track the attempt count. Maximum **3 attempts total** (including the first score run that triggered the loop).

### Each iteration

1. Review all flagged issues from the most recent `prompt-score` scorecard.
2. Rewrite the prompt to address every flagged issue. Priority order:
   - Unhandled branches (R3) — define the missing outcome for every IF
   - Missing escalation paths (R4, M3) — add trigger + reason for every gap case
   - Vague language (M2) — replace with specific field names (natural language), document names (exact from vesta-doc-types.md), or criteria
   - Unnamed documents (M5) — use full document type names from `../prompt-guardrails/vesta-doc-types.md` with " document" suffix
   - Missing notes step (M6) — add a dedicated notes step immediately before every terminal
   - Dangling paths (R6) — every path must end in `status=completed`, an escalation, or `Do not complete the task.` preceded by a note
   - UI references (R7) — rewrite as `Use search_loan_data_model to get [field]`
3. Re-run `prompt-score` on the revised prompt. Render the updated scorecard.
4. Calculate `average = total ÷ 13`.
5. **If average > 9.0** → determine the save path using the **Save Path Rules** below, write the file, and confirm the path to the user. Done.
6. **If average ≤ 9.0 and attempts < 3** → increment attempt count and repeat from step 1.
7. **If average ≤ 9.0 and attempts = 3** → stop. Report:

> After 3 improvement attempts, the best score achieved was **X.X / 10**.
> Would you like to **save this version anyway**, or provide additional guidance so I can keep improving it?

Do NOT save automatically — wait for the user's explicit decision.

---

## Save Path Rules

Determine the output path before writing the file:

1. **File path was provided** → overwrite that exact file in place. Do not change the file name or location.
2. **Prompt was pasted inline (no file path)** → save to `{parent-directory-of-this-skill}/output-prompts/{task-name}.md`, where the parent directory is the directory that contains the `.cursor/skills/` folder (i.e., never save inside `.cursor/`).

> **Never write any file inside a `.cursor/` directory.**

| Property      | Value                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| File path provided | Overwrite the original file at its existing path                                                                   |
| No file path  | Save to `output-prompts/{task-name}.md` in the workspace root (parent of `.cursor/`)                                       |
| File name     | Task name slug from the prompt title (e.g., `closing-date-adjustment.md`) — only applies when no file path was provided    |
| File contents | Final rewritten prompt only — no scorecard, no audit report                                                                 |

---

## Referenced Skills

- Guardrails audit: `../prompt-guardrails/SKILL.md`
- Scoring: `../prompt-score/SKILL.md`

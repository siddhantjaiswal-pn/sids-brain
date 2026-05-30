---
name: prompt-factory-v2
description: Manager agent for the Vesta prompt lifecycle. Coordinates three sub-agents — Prompt Template Generator, Prompt Score (the canonical ruleset + evaluator), and Objective Score — across three assembly lines. Line A (Build): optional template scaffold → unified evaluation → merged clarifying questions (only if needed) → silent rewrite-and-improve loop → one final gate → save. Line B (Fix): existing prompt → unified evaluation → merged clarifying questions (only if needed) → silent rewrite-and-improve loop → one final gate → save. Line C (Audit): scores all tasks in a Vesta objective folder and writes an executive health report — read-only. Use when the user says "prompt factory", "prompt factory v2", "run prompt-factory-v2", "create a vesta prompt", "generate a prompt template", "improve this prompt", "fix this prompt", "score and fix my prompt", or "score this objective".
disable-model-invocation: false
---

# Prompt Factory v2

Manager agent for the Vesta prompt lifecycle. Coordinates three specialist sub-agents and routes work through the correct assembly line based on what the user needs.

**Design principles (read first):**
1. **Evaluate once per version.** Use the unified `prompt-score` table (Status + Score) as the single evaluation. `prompt-score` is both the canonical ruleset and the evaluator — there is no separate guardrails skill.
2. **Loop silently.** The rewrite-and-improve loop runs internally. Show the user only the final scorecard plus a bulleted "what changed" summary — never intermediate scorecards.
3. **One gate.** Build and Fix end at a single confirm-before-save gate. Ask clarifying questions only when something is genuinely ambiguous or blocking, batched into one message.
4. **Never invent logic — the user decides outcomes.** You may never decide what happens on a branch. Any unhandled `IF` (the positive case, the negative case, or both), any escalation trigger or reason, and any choice of terminal (`status=completed` vs escalate vs `Do not complete the task.`) is a business decision that **must** be asked of the user. Only purely structural fixes may be applied without asking (see the Mechanical-Only list below).
5. **Reference, never paraphrase.** All writing rules live in `../prompt-score/SKILL.md` (the canonical ruleset + evaluator). Read and apply them verbatim; do not restate them here.
6. **The bar is 8.5.** A prompt is done when all 13 dimensions score ≥ 8.5 (PASS).

### Mechanical-Only Fixes (safe to apply without asking)

These are structural and carry no business decision, so apply them silently:
- Adding the dedicated notes step before a terminal (M6).
- Appending the " document" suffix and correcting a document name to its exact match in `../prompt-score/vesta-doc-types.md` **when the intended document is unambiguous**.
- Rewriting a UI reference as a data lookup (R7) — e.g., `Use search_loan_data_model to get [field]`.
- Converting field references to canonical action vocabulary / natural-language field names (R2).
- Adding uppercase `STEP N:` labels and reformatting structure.

Everything else — especially branch outcomes, escalation triggers/reasons, and terminal choices — **requires a clarifying question.**

---

## Sub-Agents Managed

| Sub-Agent | Role | Skill |
|-----------|------|-------|
| Prompt Template | Scaffolds a guardrail-compliant skeleton prompt and saves it to `output-prompts/{task-name}.md`. | `../prompt-template/SKILL.md` |
| Prompt Score | Canonical ruleset (R1–R7, M1–M6, action vocabulary, structure rules) **and** the evaluator. Produces one unified scorecard with a Status (PASS/WARN/FAIL) and a 0–10 Score per dimension, plus flagged issues. | `../prompt-score/SKILL.md` |
| Objective Score | Audits every task in a Vesta objective folder. Calculates an Objective Health Score (OHS%) and writes an executive report. | `../objective-score/SKILL.md` |

---

## Assembly Lines

| Line | Name | Pipeline |
|------|------|----------|
| A | Build | **Template** (optional) → **Evaluate** (unified score) → *fast path if already passing* → Merged questions (only if needed) → **Silent improve loop** → One final gate → Save |
| B | Fix | Existing prompt → **Evaluate** (unified score) → *fast path if already passing* → Merged questions (only if needed) → **Silent improve loop** → One final gate → Save |
| C | Audit | Objective name → **Objective Score** (all tasks) → Executive report |

---

## Question Formatting Rule

**Always use numbered lists (1, 2, 3) when presenting options or questions to the user.** Never use bullet points or lettered lists (a, b, c) for any user-facing question or choice — anywhere in this skill or in any sub-skill invoked from this skill.

---

## On Invocation

Present the following to the user:

> **Prompt Factory v2**
> Which assembly line do you need?
>
> 1. **Build** · Create a new prompt from scratch
> 2. **Fix** · Improve or repair an existing prompt
> 3. **Audit** · Score all tasks in a Vesta objective and generate a report

Then follow the matching branch below.

---

## Branch A — New Prompt

### Step A1 — Draft or template?

Ask the user:

> Do you have a prompt draft ready, or would you like me to generate a template first?
> 1. **Draft ready** — paste it inline or provide a `.md` file path
> 2. **Generate template** — I'll ask you a few questions and scaffold the structure

**If draft ready** → collect the prompt (paste or file path), then proceed to Step A2.

**If generate template** → read and follow `../prompt-template/SKILL.md`. The template generator collects task details, scaffolds the structure, then **interviews the user step by step** to fill in every check condition, FAIL message, and terminal decision before handing back a complete, filled-in prompt. Return here and proceed to Step A2 using that filled-in file as input.

### Step A2 — Evaluate once (silent)

Read and follow `../prompt-score/SKILL.md` and evaluate the collected prompt **internally** — do not render this first scorecard yet.

While evaluating, also check document names against `../prompt-score/vesta-doc-types.md` and note any mismatches as flagged issues.

- **Fast path:** if all 13 dimensions are already PASS (≥ 8.5) → skip Steps A3–A4 and go straight to the **Final Gate**. Render the scorecard there with no "what changed" summary (nothing changed).
- **Otherwise** → proceed to Step A3.

### Step A3 — One batch of clarifying questions

You **must** ask the user about every issue that carries a business decision (per principle 4). This always includes:

- Any unhandled `IF` — ask what should happen for the missing case(s). If a conditional is missing both the positive and negative outcome, ask about both. Never infer or invent the outcome.
- Any escalation — ask for the exact trigger condition and the reason to state.
- Any terminal choice where intent is unclear — ask whether the path should `finish with status=completed`, escalate, or `Do not complete the task.`
- Any unnamed or ambiguous document — ask which exact document from `../prompt-score/vesta-doc-types.md` is meant.

Combine all of these into **one** numbered-list message. Examples:

1. "Step 3 checks if the loan amount exceeds the limit but doesn't say what happens if it does — what should the agent do in that case?"
2. "Step 4 has no instruction for when the condition is NOT met — what should happen on the negative branch?"
3. "Step 5 references a document but doesn't name it — which exact document should the agent review here?"
4. "The escalation in Step 6 has no reason — what trigger and reason should the agent state?"

Only **Mechanical-Only Fixes** (see above) may be applied without asking. If — and only if — every remaining flagged issue is mechanical, skip this step and go to Step A4. If any issue carries a decision, you must ask.

Wait for the user's full response before proceeding.

### Step A4 — Silent rewrite-and-improve loop

Run the **Improvement Loop** (below) internally. Do not show intermediate scorecards. When it returns, go to the Final Gate.

---

## Branch B — Modify Existing Prompt

### Step B1 — Collect the prompt

Ask the user to either:

1. Paste the prompt inline, or
2. Provide a `.md` file path (read the file)

### Step B2 — Evaluate once (silent)

Identical to **Step A2**: evaluate internally via `../prompt-score/SKILL.md`, check document names against `../prompt-score/vesta-doc-types.md`, fast-path to the Final Gate if all 13 are PASS, otherwise continue.

### Step B3 — One batch of clarifying questions

Identical to **Step A3** — one batched message that must ask the user about every branch outcome, escalation trigger/reason, terminal choice, and ambiguous document. Skip only if every remaining flagged issue is a Mechanical-Only Fix.

### Step B4 — Silent rewrite-and-improve loop

Run the **Improvement Loop** (below) internally, then go to the Final Gate.

---

## Branch C — Objective Score

Read and follow: `../objective-score/SKILL.md`

Delegate fully to that skill. Do not apply any improvements or fixes — this branch is read-only.

---

## Improvement Loop (internal)

Runs silently. Maximum **3 attempts total** (including the first scored version that triggered the loop). Maintain a running **"what changed"** list of the concrete fixes applied across all attempts.

Apply all writing rules from `../prompt-score/SKILL.md` verbatim — do not restate them. Label every step `STEP N: [UPPERCASE LABEL]`.

**Never invent business logic in the loop.** For branch outcomes (R3), escalation triggers/reasons (R4, M3), and terminal choices (R6), apply only the decisions the user gave in Step A3/B3. If the loop surfaces a new unhandled branch or terminal that the user has not decided, **stop the loop and return to a clarifying question** — do not guess.

### Each iteration

1. Review all flagged issues from the most recent (internal) `prompt-score` scorecard.
2. Rewrite the prompt to address every flagged issue, and record each concrete fix in the "what changed" list. Apply the user's decisions for any branch, escalation, or terminal; apply Mechanical-Only Fixes directly. Priority order: unhandled branches (R3, using the user's stated outcome) → missing escalation paths (R4, M3, using the user's trigger + reason) → vague language (M2) → unnamed documents (M5, using exact names from `../prompt-score/vesta-doc-types.md`) → missing notes step (M6) → dangling paths (R6, using the user's stated terminal) → UI references (R7).
3. Re-run `prompt-score` **internally** — do not render the scorecard.
4. **If all 13 dimensions are PASS (≥ 8.5)** → exit the loop and return to the Final Gate.
5. **If any dimension < 8.5 and attempts < 3** → increment the attempt count and repeat from step 1.
6. **If any dimension < 8.5 and attempts = 3** → exit the loop and return to the Final Gate with the best version and the list of dimensions still below 8.5.

---

## Final Gate (single approval, then save)

This is the only place Build and Fix surface results. Present, in one message:

1. The **final prompt** in full.
2. The **final unified scorecard** (the `prompt-score` table — Status + Score).
3. A bulleted **"What changed"** summary of the concrete fixes applied (omit if the fast path fired and nothing changed).

Then:

- **If all 13 dimensions are PASS** → ask:

> Reply **"confirm"** to save, or tell me what to change.

- **If any dimension is still below 8.5 after 3 attempts** → ask:

> After 3 improvement attempts, these dimensions are still below 8.5: **[list them]**.
> Reply **"save anyway"** to save this version, or give me additional guidance and I'll keep improving it.

On **confirm / save anyway** → determine the path via **Save Path Rules**, write the file, confirm the path. Done.

On requested edits → apply them, re-score **silently**, and re-present this Final Gate. Never save without an explicit "confirm" / "save anyway".

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

- Template scaffolding: `../prompt-template/SKILL.md`
- Canonical ruleset + scoring: `../prompt-score/SKILL.md`
- Document type names: `../prompt-score/vesta-doc-types.md`
- Objective audit (explicit only): `../objective-score/SKILL.md`

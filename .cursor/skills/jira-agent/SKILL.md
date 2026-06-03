---
name: jira-agent
description: Creates a new Jira ticket in the Pennymac HIS project. Handles gathering requirements, polishing input, setting default fields, confirming before creation, and applying the Story or Bug ADF template. Use when the user wants to create a new Jira ticket, open a story, file a bug, or says "create a ticket", "new ticket", "add a story", or "log a bug" in the HIS project.
---

# Create Jira Ticket

Focused workflow for creating a new HIS project ticket as a child of an Epic.

**Cloud ID**: `horizonpennymac.atlassian.net` | **Project**: `HIS`

---

## Domain Context

Before writing any ticket content, read [`admin-config.md`](admin-config.md) in this skill's directory. It describes the Vesta Loan Origination System — Objectives, Tasks, Automated Actions, Validations, Loan Stages, and related concepts.

Use this context to interpret shorthand in the user's summaries and action items. For example:

- "objective not opening" → the objective's Readiness condition is not being met, or it is being suppressed
- "task not triggering" → the parent objective is not Open, or the task's Relevance condition is not met
- "Escalated status" → an objective status value that should suppress further opening
- "funds ordered date" → a date field on the loan controlled by task logic
- "wire sweep time" → cutoff time logic in an instruction task within the objective
- "Exhibit A / Security Instrument" → a document type reviewed by a task in the objective

When writing the **Summary paragraph** and **Acceptance Criteria**, use correct Vesta terminology (Objective, Task, Readiness, Relevance, Automated Action, etc.) rather than generic language.

---

## Step 1: Gather Information

Collect all of the following in a single ask (batch your questions):

1. **Epic parent** — ticket ID (e.g. `HIS-498`). Validate it exists with `getJiraIssue`.
2. **Ticket type** — Story or Bug? Always ask explicitly, never assume.
3. **Summary** — concise title.
4. **Description** — what the ticket is about (raw input is fine, polish it before writing).
5. **Sprint** — only ask if user brings it up.
6. **Story Points** — auto-calculated from action item count (see Story Points Rule below). Only override if the user explicitly provides a value.

**Bug-only — Pennymac or Vesta?**: When the ticket type is Bug, always ask the user whether the bug is for **Pennymac** or **Vesta** before proceeding. Include this in the same single-ask batch as the other questions. Use the answer to set the Responsible Party field (`customfield_10104`) — `Pennymac` maps to `{"value": "Pennymac", "id": "10132"}`; if the user says Vesta, look up the correct option ID via `getJiraIssueTypeMetaWithFields` before creating the ticket.

**Polish all user input** before writing to Jira: rewrite into clear, professional language at an easy-to-medium reading level. Do not confirm the polished version unless meaning is ambiguous.

### Story Points Rule (Stories only)

Auto-calculate story points from the number of action items provided:

| Action Items | Story Points |
| ------------ | ------------ |
| 1 (and description looks straightforward) | 2 |
| 2 | 3 |
| 3–4 | 5 |
| 5+ | **Ask the user** — do not proceed until confirmed |

Always include `customfield_10032` in `additional_fields` when creating a Story. If the user explicitly provides a story point value, use that instead.

## Step 2: Confirm Before Creating

Show a preview and wait for explicit confirmation:

```
Ticket to create:
  Project:      [HIS / BTX / …]
  Type:         Story
  Parent Epic:  [Epic title]
  Summary:      [polished summary]
  Description:  [first 200 chars of polished description…]
  [Project-specific required fields at their defaults]
  Assignee:     Siddhant Jaiswal
  Sprint:       Not set
  Story Points: [auto-calculated value, or "Pending — confirm with user" if 5+ action items]
```

If user wants changes, update and re-confirm before proceeding.

## Step 3: Create the Ticket

### Project-specific required fields

Each project has different required `additional_fields`. Use the correct defaults based on the parent Epic's project key.

#### HIS (Horizon Internal Services)

```
createJiraIssue(
  cloudId            = "horizonpennymac.atlassian.net",
  projectKey         = "HIS",
  issueTypeName      = "Story",          // or "Bug"
  summary            = "<polished>",
  description        = "<polished>",
  parent             = "HIS-498",
  assignee_account_id = "712020:4ddaaf98-60fb-4b88-8366-1ccb9c511a27",
  additional_fields  = {
    "customfield_10035": [{"value": "CDL", "id": "10022"}],
    "customfield_10036": {"value": "Horizon Internal Services", "id": "10024"},
    "customfield_10037": [{"value": "Eligibles", "id": "10273"}]
  },
  contentFormat = "markdown"
)
```

#### BTX (Business Transformation Execution)

```
createJiraIssue(
  cloudId            = "horizonpennymac.atlassian.net",
  projectKey         = "BTX",
  issueTypeName      = "Story",          // or "Bug"
  summary            = "<polished>",
  description        = "<polished>",
  parent             = "BTX-1",
  assignee_account_id = "712020:4ddaaf98-60fb-4b88-8366-1ccb9c511a27",
  additional_fields  = {
    "customfield_10104": [{"value": "Pennymac", "id": "10132"}],
    "customfield_10036": {"value": "AI: Agent Implementation", "id": "10770"},
    "customfield_10037": [{"value": "BT Core", "id": "10803"}]
  },
  contentFormat = "markdown"
)
```

BTX required fields reference:

| Field             | Field ID            | Default Value              | Default ID |
| ----------------- | ------------------- | -------------------------- | ---------- |
| Responsible Party | `customfield_10104` | `Pennymac`                 | `10132`    |
| Work-Stream       | `customfield_10036` | `AI: Agent Implementation` | `10770`    |
| Teams             | `customfield_10037` | `BT Core`                  | `10803`    |

Add to `additional_fields` for Stories (Story Points always included; Sprint only when user specifies):

| Field        | Field ID            | Format                  | When to include |
| ------------ | ------------------- | ----------------------- | --------------- |
| Story Points | `customfield_10032` | `<number>`              | Always for Stories — use auto-calculated value |
| Sprint       | `customfield_10020` | `{"id": "<sprint_id>"}` | Only when user specifies |

## Step 4: Apply Description Template

After creation, update description with `editJiraIssue` using `contentFormat: "adf"`.

### Story Description Template

Three panels in description — see [templates/story-adf.md](templates/story-adf.md) for full ADF.

Structure:

1. Purple `note` panel → **Summary** heading + paragraph with a synthesized summary (see below)
2. Purple `note` panel → **Process Version to be merged to Release Candidate** heading + paragraph with `SJ-<TICKET_ID>-01`
3. Blue `info` panel → **Action Items** heading + numbered list of all polished action items provided by the user

**Summary paragraph rule**: Do NOT use the raw description. Instead, read all action items the user provided and write a single synthesized sentence (or two at most) that captures the full scope of the work. Example: if the action items are (1) suppress objective when Escalated, (2) adjust Funds Ordered Date for non-business days, (3) verify Exhibit A is not blank — the summary would be: "Enhance the Agent Funding Review objective with Escalated status suppression, non-business day Funds Ordered Date handling, and Exhibit A Security Instrument blank verification."

**Action Items list rule**: Render each action item as a numbered list item (`orderedList`) in the paragraph after the Action Items panel. Never leave action items as `[To be filled in]` when they have been provided by the user.

Then update `customfield_10058` (Acceptance Criteria) — write numbered Gherkin ACs derived from the action items (see Acceptance Criteria rule below). See [templates/story-adf.md](templates/story-adf.md).

**Process Version format**: `SJ-<TICKET_ID>-<ITERATION>` — always start with `01` for new tickets.
Example: ticket `HIS-9000` → `SJ-HIS-9000-01`

### Bug Description Template

Mixed panel types — all h1 headings use an `underline` mark. See [templates/bug-adf.md](templates/bug-adf.md) for full ADF.

1. Bare `heading` (no panel) → **Issue Description** (underlined h1) + paragraph with polished description
2. Blue `info` panel → **Steps to Reproduce** (underlined h1) + orderedList `_[To be filled in]_`
3. Green `success` panel → **Expected Results** (underlined h1) + paragraph `_[To be filled in]_`
4. Yellow `warning` panel → **Actual Results** (underlined h1) + paragraph `_[To be filled in]_`
5. Purple `note` panel → **Test Data** (underlined h1) + paragraph `_[To be filled in]_`

Bugs do NOT have Acceptance Criteria.

### Update Calls

```
editJiraIssue(
  cloudId      = "horizonpennymac.atlassian.net",
  issueIdOrKey = "<new-ticket-id>",
  fields       = { "description": <ADF doc> },
  contentFormat = "adf"
)
```

For Story only — second call for Acceptance Criteria:

```
editJiraIssue(
  cloudId      = "horizonpennymac.atlassian.net",
  issueIdOrKey = "<new-ticket-id>",
  fields       = { "customfield_10058": <ADF doc> },
  contentFormat = "adf"
)
```

### Acceptance Criteria ADF rules (Stories only)

Derive one AC per action item provided by the user. Write each in Gherkin Given/When/Then format.

ADF layout:

1. Green `success` panel → **Acceptance Criteria** heading (H1). Nothing else inside the panel.
2. Outside the panel, for each AC:
   - A `paragraph` with the AC title in **bold**: `AC-N: [title]`
   - A `paragraph` with Gherkin steps: `Given`, `When`, `Then`, `And` keywords in **bold**, step body in plain text, `hardBreak` between each line.
   - A `rule` (horizontal divider) between ACs — omit after the last one.

Never write `[To be filled in]` for Acceptance Criteria when action items have been provided. Always generate real Gherkin ACs from the action items.

---

## Adding Action Items to an Existing Ticket

When the user provides **additional action items** for a ticket that already exists (e.g. "add 2 more items"):

### Step A: Fetch the current ticket

Call `getJiraIssue` to retrieve:

- The current description (to read existing action items)
- The current `customfield_10058` (to read existing ACs and determine the highest AC number)

### Step B: Build the updated state

- **Existing action items** — parse from the current description's Action Items list
- **New action items** — the items the user just provided, polished
- **All action items** = existing + new (combined, in order); when removing items, all action items = remaining items after removal, renumbered
- **Next AC number** — highest existing AC-N + 1
- **Recalculated story points** — apply the Story Points Rule table to the **total** action item count after the operation (add or remove). If the new count is 5+, ask the user before proceeding.

### Step C: Write three updates in parallel

**Description update** (`editJiraIssue` → `description`):

- Re-synthesize the **Summary paragraph** from ALL action items (existing + new)
- Keep the Process Version paragraph unchanged
- Rewrite the Action Items list with ALL items (existing + new, renumbered)

**Acceptance Criteria update** (`editJiraIssue` → `customfield_10058`):

- **Append** new Gherkin ACs for each new action item only — do NOT rewrite existing ACs
- New ACs are numbered starting from the next AC number (e.g. if existing has AC-1 through AC-3, new ones start at AC-4)
- Preserve all existing AC content exactly as-is
- Add a `rule` divider before each new AC (including before the first new one, since it follows existing content)
- When items are **removed**, rewrite the full AC field with only the remaining ACs renumbered from AC-1

**Story Points update** (`editJiraIssue` → `customfield_10032`):

- Set to the recalculated value from Step B
- Always include in the same parallel batch as the other two updates

### Step D: Report result

```
✅ Updated: [TICKET-ID]
   Link: https://horizonpennymac.atlassian.net/browse/[TICKET-ID]

   Description updated:
   - Summary re-synthesized ([total N] action items)
   - Action Items list updated ([N existing] + [N new] = [total N] items)

   Acceptance Criteria appended:
   - AC-[N] through AC-[M] added ([N new] new ACs)
   - Existing AC-1 through AC-[N-1] unchanged

   Story Points updated: [old value] → [new value]
```

## Step 5: Report Result

```
✅ Ticket Created: HIS-9001
   Summary: [summary]
   Type: Story
   Parent: HIS-498 ([Epic title])
   Link: https://horizonpennymac.atlassian.net/browse/HIS-9001

   Fields Set:
   - Channel: CDL | Work-Stream: Horizon Internal Services | Teams: Eligibles
   - Assignee: Siddhant Jaiswal
   - Story Points: [N]

   Template Applied:
   - Summary section (synthesized from action items)
   - Process Version: SJ-HIS-9001-01
   - Action Items ([N] items written)
   - Acceptance Criteria ([N] ACs written — AC-1 through AC-N)
```

## Rules

- **Always confirm** before calling `createJiraIssue`
- **Never comment** on newly created tickets
- **Never edit** the parent Epic — read it only for context
- **Never make any updates** to parent tickets or Epics — they are strictly read-only
- **Never fetch any other tickets from an Epic** — only fetch the single ticket ID explicitly provided by the user; do not retrieve siblings, children, or any other linked issues
- **ADF only** for description updates — never wiki markup or markdown
- Defaults (Channel, Work-Stream, Teams, Responsible Party, Assignee) apply per project unless user explicitly overrides
- Determine the project key from the parent Epic's key prefix (e.g. `BTX-1` → BTX, `HIS-498` → HIS) and apply that project's required fields

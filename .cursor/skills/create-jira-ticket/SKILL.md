---
name: create-jira-ticket
description: Creates a new Jira ticket in the Pennymac HIS project. Handles gathering requirements, polishing input, setting default fields, confirming before creation, and applying the Story or Bug ADF template. Use when the user wants to create a new Jira ticket, open a story, file a bug, or says "create a ticket", "new ticket", "add a story", or "log a bug" in the HIS project.
---

# Create Jira Ticket

Focused workflow for creating a new HIS project ticket as a child of an Epic.

**Cloud ID**: `horizonpennymac.atlassian.net` | **Project**: `HIS`

## Step 1: Gather Information

Collect all of the following in a single ask (batch your questions):

1. **Epic parent** — ticket ID (e.g. `HIS-498`). Validate it exists with `getJiraIssue`.
2. **Ticket type** — Story or Bug? Always ask explicitly, never assume.
3. **Summary** — concise title.
4. **Description** — what the ticket is about (raw input is fine, polish it before writing).
5. **Sprint** — only ask if user brings it up.
6. **Story Points** — only ask if user brings it up.

**Polish all user input** before writing to Jira: rewrite into clear, professional language at an easy-to-medium reading level. Do not confirm the polished version unless meaning is ambiguous.

## Step 2: Confirm Before Creating

Show a preview and wait for explicit confirmation:

```
Ticket to create:
  Project:      HIS (Horizon Internal Services)
  Type:         Story
  Parent Epic:  [Epic title]
  Summary:      [polished summary]
  Description:  [first 200 chars of polished description…]
  Channel:      CDL
  Work-Stream:  Horizon Internal Services
  Teams:        Eligibles
  Assignee:     Siddhant Jaiswal
  Sprint:       Not set
  Story Points: Not set
```

If user wants changes, update and re-confirm before proceeding.

## Step 3: Create the Ticket

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

Add to `additional_fields` only when user specified:

| Field | Field ID | Format |
|-------|----------|--------|
| Sprint | `customfield_10020` | `{"id": "<sprint_id>"}` |
| Story Points | `customfield_10032` | `<number>` |

## Step 4: Apply Description Template

After creation, update description with `editJiraIssue` using `contentFormat: "adf"`.

### Story Description Template

Three panels in description — see [templates/story-adf.md](templates/story-adf.md) for full ADF.

Structure:
1. Purple `note` panel → **Summary** heading + paragraph with polished description
2. Purple `note` panel → **Process Version to be merged to Release Candidate** heading + paragraph with `SJ-<TICKET_ID>-01`
3. Blue `info` panel → **Action Items** heading + paragraph `_[To be filled in]_`

Then update `customfield_10058` (Acceptance Criteria) separately — green `success` panel → **Acceptance Criteria** heading + paragraph `_[To be filled in]_`. See [templates/story-adf.md](templates/story-adf.md).

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

   Template Applied:
   - Summary section (populated)
   - Process Version: SJ-HIS-9001-01
   - Action Items (to be filled in)
   - Acceptance Criteria (to be filled in)
```

## Rules

- **Always confirm** before calling `createJiraIssue`
- **Never comment** on newly created tickets
- **Never edit** the parent Epic — read it only for context
- **Never make any updates** to parent tickets or Epics — they are strictly read-only
- **Never fetch any other tickets from an Epic** — only fetch the single ticket ID explicitly provided by the user; do not retrieve siblings, children, or any other linked issues
- **ADF only** for description updates — never wiki markup or markdown
- Defaults (Channel, Work-Stream, Teams, Assignee) apply unless user explicitly overrides

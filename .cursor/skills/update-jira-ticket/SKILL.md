---
name: update-jira-ticket
description: Applies the standard Story or Bug ADF description template to an existing HIS Jira ticket. Only updates the description (and Acceptance Criteria for Stories) — never touches any other fields. Use when the user provides an existing ticket ID and wants the template applied, or says "update ticket", "apply template", "stamp the template", or "fill in the description".
---

# Update Jira Ticket (Apply Template)

Applies the standard Story or Bug description template to an **already-created** HIS ticket.  
**No other fields are touched** — summary, assignee, sprint, story points, custom fields, etc. remain exactly as they are.

**Cloud ID**: `horizonpennymac.atlassian.net` | **Project**: `HIS`

## Step 1: Fetch the Ticket

Call `getJiraIssue` with the provided ticket ID to retrieve:
- `issuetype.name` — determines which template to use (Story vs Bug)
- `summary` — displayed in the confirmation preview
- `description` — checked to warn if content would be overwritten

```
getJiraIssue(
  cloudId      = "horizonpennymac.atlassian.net",
  issueIdOrKey = "<TICKET_ID>"
)
```

If the ticket does not exist, stop and tell the user.

## Step 2: Determine Template

| Issue Type | Template |
|------------|----------|
| Story, Task, Sub-task | Story template |
| Bug | Bug template |

If the issue type is ambiguous or unrecognised, ask the user which template to apply.

## Step 3: Confirm Before Updating

Show a preview and wait for explicit confirmation:

```
Ticket to update:
  Ticket:   HIS-XXXX
  Type:     Story (or Bug)
  Summary:  [ticket summary]
  Link:     https://horizonpennymac.atlassian.net/browse/HIS-XXXX

  ⚠️  This will OVERWRITE the existing description.
  (only description will be changed — all other fields stay as-is)

  Template to apply:
  - [Story] Summary panel (populated with ticket summary)
             Process Version: SJ-HIS-XXXX-01
             Action Items: [To be filled in]
             Acceptance Criteria: [To be filled in]
  - [Bug]   Issue Description (populated with ticket summary)
             Steps to Reproduce / Expected Results / Actual Results / Test Data: [To be filled in]

Proceed? (yes / no)
```

If the existing description is **non-empty**, always include the ⚠️ overwrite warning.  
If user wants changes, update and re-confirm before proceeding.

## Step 4: Apply Description Template

Update the description with `editJiraIssue` using `contentFormat: "adf"`.

### Story Description Template

Three panels — see [templates/story-adf.md](templates/story-adf.md) for full ADF.

Structure:
1. Purple `note` panel → **Summary** heading + paragraph with ticket summary
2. Purple `note` panel → **Process Version to be merged to Release Candidate** heading + paragraph with `SJ-<TICKET_ID>-01`
3. Blue `info` panel → **Action Items** heading + paragraph `_[To be filled in]_`

**Process Version format**: `SJ-<TICKET_ID>-<ITERATION>` — always start with `01` when stamping template fresh.  
Example: ticket `HIS-9000` → `SJ-HIS-9000-01`

Then make a **second** `editJiraIssue` call to update `customfield_10058` (Acceptance Criteria) — green `success` panel → **Acceptance Criteria** heading + paragraph `_[To be filled in]_`.

### Bug Description Template

Mixed panel types — all h1 headings use an `underline` mark. See [templates/bug-adf.md](templates/bug-adf.md) for full ADF.

1. Bare `heading` (no panel) → **Issue Description** (underlined h1) + paragraph with ticket summary
2. Blue `info` panel → **Steps to Reproduce** (underlined h1) + orderedList `_[To be filled in]_`
3. Green `success` panel → **Expected Results** (underlined h1) + paragraph `_[To be filled in]_`
4. Yellow `warning` panel → **Actual Results** (underlined h1) + paragraph `_[To be filled in]_`
5. Purple `note` panel → **Test Data** (underlined h1) + paragraph `_[To be filled in]_`

Bugs do NOT have Acceptance Criteria.

### Update Calls

**Description** (both Story and Bug):

```
editJiraIssue(
  cloudId      = "horizonpennymac.atlassian.net",
  issueIdOrKey = "<TICKET_ID>",
  fields       = { "description": <ADF doc> },
  contentFormat = "adf"
)
```

**Acceptance Criteria** (Story only — second call):

```
editJiraIssue(
  cloudId      = "horizonpennymac.atlassian.net",
  issueIdOrKey = "<TICKET_ID>",
  fields       = { "customfield_10058": <ADF doc> },
  contentFormat = "adf"
)
```

## Step 5: Report Result

```
✅ Template Applied: HIS-XXXX
   Summary: [ticket summary]
   Type: Story (or Bug)
   Link: https://horizonpennymac.atlassian.net/browse/HIS-XXXX

   Updated:
   - Description: template applied
   - Process Version: SJ-HIS-XXXX-01        ← Story only
   - Action Items: [To be filled in]         ← Story only
   - Acceptance Criteria: [To be filled in]  ← Story only

   Not changed:
   - All other fields (summary, assignee, sprint, story points, etc.)
```

## Rules

- **Always confirm** before calling `editJiraIssue`
- **Only update** `description` and (for Stories) `customfield_10058` — nothing else
- **Never comment** on the ticket after updating
- **ADF only** — never wiki markup or markdown for description updates
- **Never make any updates** to parent tickets or Epics — they are strictly read-only
- **Never fetch any other tickets from an Epic** — only fetch the single ticket ID explicitly provided by the user; do not retrieve siblings, children, or any other linked issues
- Use the ticket's existing **summary** as the content for the Summary / Issue Description section of the template

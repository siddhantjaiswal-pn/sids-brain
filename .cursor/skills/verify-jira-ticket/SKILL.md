---
name: verify-jira-ticket
description: Validates all fields and description sections of an existing HIS Jira ticket against team standards. Detects missing fields, unfilled placeholders, wrong defaults, and malformed description templates. Interactively asks questions for any missing data, then applies all fixes in one pass. Use when the user says "verify ticket", "validate ticket", "check ticket", "audit ticket", or provides a ticket ID and wants it reviewed for completeness.
---

# Verify Jira Ticket

Fetches a HIS ticket, validates every field and description section, asks targeted questions for anything missing or unfilled, then applies all fixes.

**Cloud ID**: `horizonpennymac.atlassian.net` | **Project**: `HIS`

## Step 1: Fetch the Ticket

```
getJiraIssue(
  cloudId      = "horizonpennymac.atlassian.net",
  issueIdOrKey = "<TICKET_ID>"
)
```

If the ticket does not exist, stop and tell the user.

## Step 2: Run Validation

Run all checks defined in [checks.md](checks.md). Categorise each result as:

| Symbol | Meaning |
|--------|---------|
| ✅ | Passes — correct value present |
| ❌ | Fails — missing, wrong, or still a placeholder |
| ⚠️ | Warning — optional field not set |

### Fields to Validate

**Standard Fields (all types)**

| Check | Pass Condition |
|-------|---------------|
| Summary | Non-empty string |
| Assignee | Set (warn if not Siddhant Jaiswal `712020:4ddaaf98-60fb-4b88-8366-1ccb9c511a27`) |
| Channel (`customfield_10035`) | Set; default `CDL (10022)` |
| Work-Stream (`customfield_10036`) | Set; default `Horizon Internal Services (10024)` |
| Teams (`customfield_10037`) | Set; default `Eligibles (10273)` |
| Sprint (`customfield_10020`) | ⚠️ warn if unset |
| Story Points (`customfield_10032`) | ⚠️ warn if unset |
| Parent / Epic | ⚠️ warn if unset |
| Description | Non-null and structurally valid (see below) |

**Story Description Structure**

| Section | Check |
|---------|-------|
| Summary panel (`note`) | h1 "Summary" heading present |
| Summary content | Paragraph after panel is non-empty and not `[To be filled in]` |
| Process Version panel (`note`) | h1 "Process Version to be merged to Release Candidate" present |
| Process Version content | Matches `SJ-HIS-XXXX-\d{2}` pattern |
| Action Items panel (`info`) | h1 "Action Items" heading present |
| Action Items content | Paragraph present (placeholder is acceptable — flag for user) |
| Acceptance Criteria (`customfield_10058`) | Green `success` panel with h1 "Acceptance Criteria" |
| AC content | Paragraph present (placeholder is acceptable — flag for user) |

**Bug Description Structure**

| Section | Check |
|---------|-------|
| Issue Description | Bare h1 with `underline` mark and non-empty paragraph |
| Steps to Reproduce | `info` panel with h1 + content after panel |
| Expected Results | `success` panel with h1 + content after panel |
| Actual Results | `warning` panel with h1 + content after panel |
| Test Data | `note` panel with h1 + content after panel |

## Step 3: Present Validation Report

Show the full report before asking any questions:

```
🔍 Validation Report: HIS-XXXX
   Summary: [ticket summary]
   Type:    Story | Bug
   Link:    https://horizonpennymac.atlassian.net/browse/HIS-XXXX

   FIELDS
   ✅ Summary         "…"
   ✅ Assignee        Siddhant Jaiswal
   ✅ Channel         CDL
   ❌ Work-Stream     (not set)
   ✅ Teams           Eligibles
   ⚠️  Sprint          (not set)
   ⚠️  Story Points    (not set)
   ⚠️  Parent          (not set)

   DESCRIPTION
   ✅ Summary panel           present
   ❌ Summary content         "[To be filled in]" — needs real content
   ✅ Process Version panel   present
   ✅ Process Version         SJ-HIS-9000-01
   ✅ Action Items panel      present
   ❌ Action Items content    "[To be filled in]" — needs real content
   ✅ Acceptance Criteria     present
   ❌ AC content              "[To be filled in]" — needs real content

   Issues found: 3 ❌  |  Warnings: 3 ⚠️
```

If everything passes, tell the user the ticket is complete and stop.

## Step 4: Gather Missing Information

For each ❌ failure that requires user input (i.e. cannot be auto-fixed with a default value), ask targeted questions.

**Auto-fixable without asking** (apply default silently, mention in summary):
- Missing Channel → set to CDL
- Missing Work-Stream → set to Horizon Internal Services
- Missing Teams → set to Eligibles
- Missing description entirely → apply full template (confirm first)

**Requires user input before fixing**:
- Summary content is `[To be filled in]` → ask: "What should the Summary section say?"
- Action Items content is `[To be filled in]` → ask: "What are the Action Items for this ticket?"
- AC content is `[To be filled in]` → ask: "What are the Acceptance Criteria?"
- Bug Steps to Reproduce is `[To be filled in]` → ask: "What are the steps to reproduce?"
- Bug Expected Results is `[To be filled in]` → ask: "What are the expected results?"
- Bug Actual Results is `[To be filled in]` → ask: "What are the actual results?"
- Bug Test Data is `[To be filled in]` → ask: "What test data should be used?"
- Wrong Process Version → ask: "What iteration number should be used? (current: `SJ-HIS-XXXX-01`)"

**For warnings (optional fields)** — ask once, group together:
> "These optional fields are unset: Sprint, Story Points, Parent. Provide values or type 'skip' to leave them as-is."

Use the AskQuestion tool when available to batch multiple questions. Otherwise ask conversationally.

## Step 5: Confirm Changes

After collecting all answers, show a change summary and wait for confirmation:

```
📋 Planned Changes: HIS-XXXX

   Auto-fixes (defaults):
   - Work-Stream → "Horizon Internal Services"

   From your answers:
   - Description › Summary content → "[user's text]"
   - Description › Action Items → "[user's text]"
   - Acceptance Criteria → "[user's text]"

   Skipped (warnings left as-is):
   - Sprint, Story Points, Parent

Proceed? (yes / no)
```

## Step 6: Apply Updates

Execute the minimum number of `editJiraIssue` calls needed:

1. **Description** (if any description section changed) — one call with full rebuilt ADF
2. **Acceptance Criteria** (Story only, if AC changed) — one call for `customfield_10058`
3. **Standard fields** (Channel, Work-Stream, Teams, Sprint, Points) — one call combining all changed fields
4. **Parent** — only if user provided a value

Always use `contentFormat: "adf"` for description and AC fields.

Refer to [checks.md](checks.md) for exact ADF structure when rebuilding description sections.

## Step 7: Report Result

```
✅ Verification Complete: HIS-XXXX
   Summary: [ticket summary]
   Link:    https://horizonpennymac.atlassian.net/browse/HIS-XXXX

   Fixed (❌ → ✅):
   - Work-Stream set to "Horizon Internal Services"
   - Description › Summary content updated
   - Description › Action Items updated
   - Acceptance Criteria updated

   Still unset (⚠️  — skipped by user):
   - Sprint, Story Points, Parent

   No changes needed:
   - Summary, Assignee, Channel, Teams, Process Version
```

## Rules

- **Always confirm** before calling `editJiraIssue`
- **Never add comments** to the ticket
- **Never modify** fields the user did not authorise
- **ADF only** for description and AC — never wiki markup or markdown
- **Rebuild full description ADF** when any section changes — never do partial edits
- For Process Version: always preserve the existing iteration number unless user explicitly changes it
- If the ticket has no description at all, treat it as "template missing" and offer to stamp it (follow update-jira-ticket skill)
- **Never make any updates** to parent tickets or Epics — they are strictly read-only
- **Never fetch any other tickets from an Epic** — only fetch the single ticket ID explicitly provided by the user; do not retrieve siblings, children, or any other linked issues

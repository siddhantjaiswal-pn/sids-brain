---
name: Generate Agent Release Notes
description: Generates concise release notes for internal business teams from BTX Jira tickets. Accepts either a ServiceNow ticket number (searches all linked BTX tickets) or one or more direct Jira ticket links/keys (fetches those tickets directly). Use when the user says "generate release notes", "generate agent release notes", "create release notes", "release notes for [SCTASK/RITM]", provides a ServiceNow ticket number, or provides Jira ticket keys/links.
disable-model-invocation: true
---

# Generate Agent Release Notes

Read-only skill. Never edit, comment on, or transition any Jira ticket.

**Cloud ID**: `horizonpennymac.atlassian.net` | **Project**: `BTX`  
**ServiceNow field**: `customfield_10061` (ServiceNow Related Ticket)

---

## Step 1: Determine Input Mode

Inspect what the user has already provided:

**Mode A — ServiceNow ticket number** (e.g. `CHG1234567`, `SCTASK0012345`, `RITM0098765`)  
**Mode B — Jira ticket keys or links** (e.g. `BTX-20`, `BTX-21`, or full Atlassian URLs)

If the user has provided **neither**, ask:
> "Please provide either a ServiceNow ticket number (e.g. CHG1234567) or one or more Jira ticket keys/links (e.g. BTX-20, BTX-21)."

Once you know the mode, continue to the appropriate step below.

---

## Step 2A: Fetch Tickets via ServiceNow Number

Run a single JQL search — filter by ServiceNow field:

```
searchJiraIssuesUsingJql(
  cloudId = "horizonpennymac.atlassian.net",
  jql     = 'created >= -30d AND "servicenow related ticket[short text]" ~ "<SN_TICKET>" ORDER BY created DESC',
  fields  = ["summary", "status", "description", "issuetype", "customfield_10061"]
)
```

- Use `~` (contains match) on the `"servicenow related ticket[short text]"` field — this matches the ServiceNow ticket number within the field value.
- Replace `<SN_TICKET>` with the value the user provided, preserving exact casing.
- The `created >= -30d` window covers recent changes; widen to `-90d` only if the user says no results were found.

**If zero tickets are returned:**  
Tell the user no BTX tickets were found linked to that ServiceNow ticket number within the last 30 days. Ask them to double-check the ticket number and try again. Stop.

**If tickets are returned:**  
Proceed to Step 4 (skip Step 3 — no client-side filter needed).

---

## Step 2B: Fetch Tickets via Jira Keys / Links

Parse the user input to extract all Jira ticket keys (format `BTX-NN`). Accept:
- Bare keys: `BTX-20`
- Full URLs: `https://horizonpennymac.atlassian.net/browse/BTX-20`
- Comma- or space-separated lists

For each extracted key, fetch the issue:

```
getJiraIssue(
  cloudId = "horizonpennymac.atlassian.net",
  issueKey = "<KEY>",
  fields  = ["summary", "status", "description", "issuetype", "customfield_10061"]
)
```

Fetch all tickets in parallel. If any key returns a 404 / not found, note it gracefully and continue with the ones that succeeded.

Skip the client-side filter (Step 3) — the user explicitly chose these tickets.  
Set `<SN_TICKET>` in the output header to "N/A (tickets provided directly)".  
Proceed to Step 4.

---

## Step 4: Generate Release Notes

Produce the release notes in this format. Audience = internal business stakeholders, so keep language plain, outcome-focused, and non-technical.

```
# Release Notes | <SN_TICKET> | [Today's date, e.g. May 19, 2026]

---
## [Ticket Key] — [Summary]
Status: ✅ Done

[Numbered list of plain-English bullet points describing what changed, drawn from the description. Each item = one discrete change. Focus on the business outcome, not technical implementation. If description is missing or too sparse, write "Details not available — see [BTX-XX](link)"]

---
[repeat for each ticket]
```

**Writing guidelines:**
- **H1** for the top-level header: `# Release Notes | <SN_TICKET> | [Date]`
- **H2** for each ticket section: `## [Ticket Key] — [Summary]`
- **Status** always rendered as `Status: ✅ Done`
- Use a **numbered list** for changes within each ticket — one item per discrete change
- Be concise and outcome-focused — lead with what the agent now does differently
- Avoid Jira jargon, field names, and implementation details
- If a ticket's description is in ADF format (not plain text), extract readable text from the `content` nodes

---

## Step 5: Save and Present Results

Save the formatted release notes to a file:

- **Directory**: `/Users/sijaiswal/Sids Brain/agent-release-notes/`
- **Filename**:
  - ServiceNow mode: `YYYY-MM-DD-<SN_TICKET>-ReleaseNotes.md` (e.g. `2026-05-06-CHG1234567-ReleaseNotes.md`)
  - Direct tickets mode: `YYYY-MM-DD-<FIRST_KEY>-ReleaseNotes.md` (e.g. `2026-05-06-BTX-20-ReleaseNotes.md`)
- Create the directory if it does not already exist.

After saving, tell the user the file path where the notes were saved, then display the content in chat as well.

---

## Rules

- **Read-only** — never call `editJiraIssue`, `createJiraIssue`, `addJiraComment`, or any write operation
- **Never transition** tickets
- If the description is empty or null, note it gracefully — do not fabricate details
- Always link each ticket key to `https://horizonpennymac.atlassian.net/browse/<KEY>` (e.g. `https://horizonpennymac.atlassian.net/browse/BTX-20`)

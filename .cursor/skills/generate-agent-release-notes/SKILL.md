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

## Step 4: Confirm Section Groupings

Before generating, present the proposed groupings to the user and ask for confirmation.

**Auto-grouping logic:**

- Scan each ticket's summary for a leading "Agent X Y Z" pattern (e.g. "Agent Funding Review", "Agent CES IER/FER Review", "Agent Low Doc").
- Tickets that share the same agent name prefix are grouped into one section named after that agent (e.g. all "Agent Funding Review" tickets → one "Agent Funding Review" section).
- Tickets whose summary does **not** contain a recognisable agent name: propose a section name derived from the ticket summary, and flag it for user confirmation.

**Always ask for confirmation before proceeding.** Show the proposed groupings in a table:

```
Proposed sections — please confirm or correct:

| Section Name              | Tickets          |
|---------------------------|------------------|
| Agent Funding Review      | BTX-28, BTX-30   |
| Agent CES IER/FER Review  | BTX-31           |
| Agent Low Doc / Addl Low Doc Review | BTX-32 |
```

Wait for the user to confirm or provide corrections before moving to Step 5.

---

## Step 5: Generate Release Notes

Once groupings are confirmed, produce the release notes. Audience = internal business stakeholders — keep language plain, outcome-focused, and non-technical.

**Structure:**

```
# Release Notes | <SN_TICKET> | [Today's date, e.g. May 19, 2026]

---

## BTX-XX - [Section Name]
Status: ✅ Done

[Numbered list combining all bullet points from every ticket in this section. Each item = one discrete change. Focus on the business outcome, not technical implementation. If a ticket's description is missing or too sparse, write "Details not available — see BTX-XX"]

---
[repeat for each section]
```

**Writing guidelines:**

- **H1** for the top-level header: `# Release Notes | <SN_TICKET> | [Date]`
- **H2** for each section: `## BTX-XX - [Section Name]` — when multiple tickets are grouped into one section, list all keys comma-separated before the name: `## BTX-28, BTX-30 - Agent Funding Review`
- **Status** always rendered as `Status: ✅ Done`
- Merge all bullets from grouped tickets into one combined numbered list under the section — do not repeat section headers per ticket
- Be concise and outcome-focused — lead with what the agent now does differently
- Avoid Jira jargon, field names, and implementation details
- If a ticket's description is in ADF format (not plain text), extract readable text from the `content` nodes

---

## Step 6: Save Results

Save the formatted release notes to a file:

- **Directory**: `/Users/sijaiswal/Sids Brain/agent-release-notes/`
- **Filename**:
  - ServiceNow mode: `YYYY-MM-DD-<SN_TICKET>-ReleaseNotes.md` (e.g. `2026-05-06-CHG1234567-ReleaseNotes.md`)
  - Direct tickets mode: `YYYY-MM-DD-<FIRST_KEY>-ReleaseNotes.md` (e.g. `2026-05-06-BTX-20-ReleaseNotes.md`)
- Create the directory if it does not already exist.

After saving, tell the user the file path where the notes were saved, then display the content in chat as well.

---

## Step 7: Send Slack Message

After saving, always send the release notes as a Slack DM to Siddhant Jaiswal using the Slack MCP.

- **User ID**: `U07JRC0ER55` (siddhant.jaiswal@pnmac.com)
- Format the Slack message identically to the saved file (H1 header, H2 per section, numbered bullets, no ticket key hyperlinks in section headings)
- Do **not** include `[BTX-XX](link)` hyperlinks in section headings — plain section names only
- After sending, return the Slack message link to the user

---

## Rules

- **Read-only** — never call `editJiraIssue`, `createJiraIssue`, `addJiraComment`, or any write operation
- **Never transition** tickets
- If the description is empty or null, note it gracefully — do not fabricate details
- Always link each ticket key in the body text to `https://horizonpennymac.atlassian.net/browse/<KEY>` when referencing a ticket inline (e.g. in "Details not available — see [BTX-XX](link)")
- Always confirm section groupings with the user before generating (Step 4)

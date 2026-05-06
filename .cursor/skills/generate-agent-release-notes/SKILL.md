---
name: Generate Agent Release Notes
description: Generates concise release notes for internal business teams from HIS Jira tickets linked to a ServiceNow ticket. Searches all HIS tickets matching a ServiceNow Related Ticket number, filters to those with "Agent" or "Agentic" in the title, and produces a clean summary. Use when the user says "generate release notes", "generate agent release notes", "create release notes", "release notes for [SCTASK/RITM]", or provides a ServiceNow ticket number and asks for a summary.
disable-model-invocation: true
---

# Generate Agent Release Notes

Read-only skill. Never edit, comment on, or transition any Jira ticket.

**Cloud ID**: `horizonpennymac.atlassian.net` | **Project**: `HIS`  
**ServiceNow field**: `customfield_10061` (ServiceNow Related Ticket)

---

## Step 1: Get the ServiceNow Ticket Number

If the user has not already provided one, ask:
> "What is the ServiceNow ticket number? (e.g. CHG1234567)"

---

## Step 2: Fetch Matching Jira Tickets

Run a single JQL search — filter by ServiceNow field AND summary contains Agent or Agentic:

```
searchJiraIssuesUsingJql(
  cloudId = "horizonpennymac.atlassian.net",
  jql     = 'project = HIS AND cf[10061] = "<SN_TICKET>" AND (summary ~ "Agent" OR summary ~ "Agentic")',
  fields  = ["summary", "status", "description", "issuetype", "customfield_10061"]
)
```

- Use `=` (exact match) — the ServiceNow ticket number must match the field value exactly.
- Replace `<SN_TICKET>` with the value the user provided, preserving exact casing.

**If zero tickets are returned:**  
Tell the user no HIS tickets were found linked to that exact ServiceNow ticket number with "Agent" or "Agentic" in the title. Ask them to double-check the ticket number and try again. Stop.

**If tickets are returned:**  
Proceed to Step 3.

---

## Step 3: Client-Side Filter (safety net)

After results are returned, apply a secondary filter in memory:

Keep only tickets where the **summary** contains `agent` or `agentic` (case-insensitive).

> The ServiceNow field is already an exact match — this secondary filter only guards against edge cases in the summary `~` operator.

---

## Step 4: Generate Release Notes

Produce the release notes in this format. Audience = internal business stakeholders, so keep language plain, outcome-focused, and non-technical.

```
## Release Notes
Generated: [Today's date]

| Field              | Value         |
|--------------------|---------------|
| ServiceNow Change  | <SN_TICKET>   |
| Total Jira Tickets | [N]           |

---

### Agentic Enhancements Included

---
**[Ticket Key] — [Summary]**
Status: [Status]

[1–3 sentence plain-English summary of what changed/was delivered, drawn from the description. Focus on the business outcome, not the technical implementation. If description is missing or too sparse, write "Details not available — see [HIS-XXXX](link)"]

---
[repeat for each ticket]
```

**Writing guidelines:**
- One paragraph per ticket, 1–3 sentences max
- Lead with the outcome: what the agent now does differently
- Avoid Jira jargon, field names, and implementation details
- If a ticket's description is in ADF format (not plain text), extract readable text from the `content` nodes

---

## Step 5: Save and Present Results

Save the formatted release notes to a file:

- **Directory**: `/Users/sijaiswal/Sids Brain/agent-release-notes/`
- **Filename**: `YYYY-MM-DD-<SN_TICKET>-ReleaseNotes.md` (use today's date and the ServiceNow ticket number, e.g. `2026-05-06-CHG1234567-ReleaseNotes.md`)
- Create the directory if it does not already exist.

After saving, tell the user the file path where the notes were saved, then display the content in chat as well.

---

## Rules

- **Read-only** — never call `editJiraIssue`, `createJiraIssue`, `addJiraComment`, or any write operation
- **Never transition** tickets
- If the description is empty or null, note it gracefully — do not fabricate details
- Always link each ticket key to `https://horizonpennymac.atlassian.net/browse/<KEY>`

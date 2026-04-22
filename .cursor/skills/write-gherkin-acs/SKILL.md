---
name: write-gherkin-acs
description: Writes numbered Gherkin-style (Given/When/Then) acceptance criteria to the Acceptance Criteria field of an existing HIS Jira ticket using the Atlassian MCP. Only updates customfield_10058 — never touches description or other fields. Always confirms before writing. Use when the user says "write ACs", "add acceptance criteria", "write gherkin", "stamp ACs", or provides a ticket ID and Gherkin statements to add.
---

# Write Gherkin Acceptance Criteria to Jira

Writes numbered Gherkin ACs to `customfield_10058` on an HIS ticket via `editJiraIssue`.  
**Only `customfield_10058` is changed — all other fields stay untouched.**

**Cloud ID**: `horizonpennymac.atlassian.net` | **Project**: `HIS`

---

## Step 1: Gather Inputs

You need:
- **Ticket ID** (e.g. `HIS-8897`)
- **Acceptance Criteria list** — numbered ACs in Gherkin format (Given / When / Then / And)

If either is missing, ask the user before proceeding.

---

## Step 2: Fetch the Ticket

Call `getJiraIssue` to confirm the ticket exists and retrieve its summary.

```
getJiraIssue(
  cloudId      = "horizonpennymac.atlassian.net",
  issueIdOrKey = "<TICKET_ID>"
)
```

If the ticket does not exist, stop and tell the user.

---

## Step 3: Confirm Before Writing

Show a preview and wait for explicit **yes** before proceeding:

```
Ticket:   HIS-XXXX
Summary:  [ticket summary]
Link:     https://horizonpennymac.atlassian.net/browse/HIS-XXXX

Will update: Acceptance Criteria field only (customfield_10058)
Will NOT change: description, assignee, sprint, story points, or any other field

ACs to write:
  AC-1: [title]
  AC-2: [title]
  ...

Proceed? (yes / no)
```

---

## Step 4: Build the ADF and Write

Call `editJiraIssue` with `contentFormat: "adf"` targeting `customfield_10058`.

### ADF Structure

```
editJiraIssue(
  cloudId       = "horizonpennymac.atlassian.net",
  issueIdOrKey  = "<TICKET_ID>",
  contentFormat = "adf",
  fields        = { "customfield_10058": <ADF doc below> }
)
```

### ADF Layout Rules

1. **Green success panel** — contains ONLY the "Acceptance Criteria" heading (level 1). Nothing else inside the panel.
2. **Outside the panel** — for each AC, in order:
   - A `paragraph` with the AC title in **bold** (e.g. `AC-1: [title]`)
   - A `paragraph` with Gherkin steps: `Given`, `When`, `Then`, `And` keywords in **bold**, followed by plain text for the step body. Use `hardBreak` between each line.
   - A `rule` (horizontal divider) between ACs (omit after the last one).

### ADF Template

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "panel",
      "attrs": { "panelType": "success" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Acceptance Criteria" }]
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "AC-1: [title]", "marks": [{ "type": "strong" }] }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Given ", "marks": [{ "type": "strong" }] },
        { "type": "text", "text": "[step text]" },
        { "type": "hardBreak" },
        { "type": "text", "text": "When ", "marks": [{ "type": "strong" }] },
        { "type": "text", "text": "[step text]" },
        { "type": "hardBreak" },
        { "type": "text", "text": "Then ", "marks": [{ "type": "strong" }] },
        { "type": "text", "text": "[step text]" },
        { "type": "hardBreak" },
        { "type": "text", "text": "And ", "marks": [{ "type": "strong" }] },
        { "type": "text", "text": "[step text]" }
      ]
    },
    { "type": "rule" },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "AC-2: [title]", "marks": [{ "type": "strong" }] }]
    }
  ]
}
```

Repeat the title paragraph + gherkin paragraph + rule pattern for each AC.  
Omit the trailing `rule` after the final AC.  
Round down decimals in any loan amounts if relevant.

---

## Step 5: Report Result

```
✅ Acceptance Criteria written: HIS-XXXX
   Link: https://horizonpennymac.atlassian.net/browse/HIS-XXXX
   ACs written: AC-1 through AC-N
   Not changed: all other fields
```

---

## Rules

- **Always confirm** before calling `editJiraIssue`
- **STRICT — Only update `customfield_10058`** — this is the Acceptance Criteria field and the ONLY field that may ever be written to
- **NEVER write to the description field** (`description`) under any circumstances — not even to append, fix, or reformat it
- **NEVER modify any other field** — this includes but is not limited to: summary, assignee, reporter, sprint, story points, priority, labels, components, fix versions, or any custom field other than `customfield_10058`
- **Never comment** on the ticket after updating
- **ADF only** — never wiki markup or markdown
- The "Acceptance Criteria" heading inside the green success panel must always be **H1** (`"level": 1`)
- Given / When / Then / And keywords must always be **bold**
- AC titles must always be **bold**
- The green success panel contains **only** the "Acceptance Criteria" heading — Gherkin content lives outside it

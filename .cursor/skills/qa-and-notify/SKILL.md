---
name: qa-and-notify
description: Transitions a HIS Jira ticket to QA status and then sends a Slack notification to the offshore team in #team-eligibles-offshore-onshore. Use when the user says "move to QA and notify", "send to QA and ping offshore", "QA and notify", or provides a ticket ID and an offshore assignee together.
---

# QA & Notify Offshore

Single command that **transitions a ticket to QA** then **notifies the offshore assignee** on Slack — in one flow.

`cloudId = "horizonpennymac.atlassian.net"` for all Jira calls.

---

## Step 1: Gather Inputs (one ask)

Collect everything upfront in a single message if the user didn't already provide it:

| Input             | Required | Default             |
| ----------------- | -------- | ------------------- |
| Ticket ID         | Yes      | —                   |
| Offshore assignee | Yes      | —                   |
| Config version    | No       | `SJ-<TICKET_ID>-01` |
| Testing notes     | No       | omit if none        |

If all info is already inline, skip asking.

---

## Step 2: Fetch Ticket

```
getJiraIssue(cloudId="horizonpennymac.atlassian.net", issueIdOrKey="HIS-XXXX")
```

Note: current status, summary, and assignee.

---

## Step 3: Assign Ticket to Offshore User on Jira

Before transitioning, assign the ticket to the offshore assignee on Jira:

1. Look up the offshore assignee's Jira account ID using `lookupJiraAccountId`
2. Assign the ticket using `editJiraIssue` with the assignee field

```
lookupJiraAccountId(cloudId="horizonpennymac.atlassian.net", searchString="[Name]")
editJiraIssue(cloudId="horizonpennymac.atlassian.net", issueIdOrKey="HIS-XXXX", fields={"assignee": {"accountId": "..."}})
```

---

## Step 4: Plan the Transition Path

| Current Status | Path                                                     |
| -------------- | -------------------------------------------------------- |
| Ready          | Ready → Dev → QA                                         |
| Dev            | Dev → QA                                                 |
| QA             | Already in QA — skip transition, still send notification |
| Other          | List available transitions and ask user                  |

Discover transition IDs from the `transitions` array in the response — **never hard-code IDs**.

---

## Step 5: Confirm Before Doing Anything

Show a single combined summary before taking any action:

```
📋 QA & Notify Plan

Ticket: HIS-XXXX — [Summary]
Current Status: [Status]
Transition Path: [e.g. Dev → QA]
Jira Assignee: Will assign to [Name]

Offshore Assignee: [Name]
Config Version: SJ-HIS-XXXX-01
Notes: [notes or "none"]
Slack Channel: #team-eligibles-offshore-onshore

Proceed?
```

Wait for confirmation before executing anything.

---

## Step 6: Transition to QA

Execute each step in the transition path sequentially via `transitionJiraIssue`. Confirm each step succeeds before proceeding to the next.

If a required-field error occurs, ask the user for the value and retry.

---

## Step 7: Compose Slack Message

Use the offshore team roster:

| Name            | Slack ID      |
| --------------- | ------------- |
| Chirag Bhardwaj | `U02326LFJPL` |
| Sonic Mamidala  | `U08L7LBM1EH` |
| Vibha Katre     | `U09JYKK5H71` |
| Ravi Goyal      | `U09H6Q67QSW` |

Show the draft to the user and ask for approval before sending. Compose **one message per person**.

Preview format:

```
📋 Drafts for #team-eligibles-offshore-onshore (N separate messages)

--- Message 1 (Name) ---
[message]

--- Message 2 (Name) ---
[message]

Send all N messages? (yes / edit)
```

Message template per person:

```
<@SLACK_ID> — This ticket is ready for testing: (use "These tickets are ready for testing:" if there are multiple tickets)

• *TICKET_ID* — [Ticket Title] https://horizonpennymac.atlassian.net/browse/TICKET_ID
• Config Version: `SJ-TICKET_ID-01`
• Notes: <testing note, or omit this line if none>

• *TICKET_ID2* — [Ticket Title2] https://horizonpennymac.atlassian.net/browse/TICKET_ID2
• Config Version: `SJ-TICKET_ID2-01`

```

Rules:

- One message per person — never combine multiple teammates into one message
- Use `<@SLACK_ID>` syntax for mentions (not `@Name`)
- Bold the ticket ID with `*HIS-XXXX*`
- Only include the Notes line if there are actual testing notes
- Multiple tickets for one person → multiple bullets in their message
- If the user wants edits, update and re-preview all drafts before sending

---

## Step 8: Send Slack Message

After approval:

```
slack_send_message(channel_id = "C093GGD044R", message = "<composed message>")
```

---

## Step 9: Final Report

```
✅ Done — HIS-XXXX

  Jira: Assigned to [Name] and transitioned to QA
  Slack: Notification sent to [Name] in #team-eligibles-offshore-onshore
  Link: https://horizonpennymac.atlassian.net/browse/HIS-XXXX
  Message: [Slack message link]
```

---

## Rules

- **Always assign** the ticket to the offshore user on Jira before transitioning
- **Never modify** parent tickets, Epics, or sibling tickets — read-only
- **Never fetch** tickets other than the one explicitly provided
- **Always preview** the Slack message before sending
- One Slack message per offshore assignee
- Config version must be present — infer from Jira description or ask
- The offshore assignee specified is used for both Jira assignment and Slack notification

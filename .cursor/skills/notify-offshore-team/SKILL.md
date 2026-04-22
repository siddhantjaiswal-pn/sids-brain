---
name: notify-offshore-team
description: Sends a Jira ticket notification message to the #team-eligibles-offshore-onshore Slack channel, tagging offshore teammates with their assigned tickets, config version, Jira link, and testing notes. Use when the user wants to notify the offshore team about tickets, says "send to offshore", "notify the team", "ping offshore", "let the offshore team know", or asks to send testing assignments to Chirag, Sonic, Vibha, or Ravi.
---

# Notify Offshore Team

Sends a formatted message to `#team-eligibles-offshore-onshore` (`C093GGD044R`) tagging offshore teammates with their Jira ticket assignments.

## Offshore Team Members

| Name            | Slack ID      | Jira Name       |
| --------------- | ------------- | --------------- |
| Chirag Bhardwaj | `U02326LFJPL` | Chirag Bhardwaj |
| Sonic Mamidala  | `U08L7LBM1EH` | Sonic Mamidala  |
| Vibha Katre     | `U09JYKK5H71` | Vibha Katre     |
| Ravi Goyal      | `U09H6Q67QSW` | Ravi Goyal      |

**Team file for reference:** `Team/my-team.md`

## Step 1: Gather Information

Collect the following (batch all questions in one ask):

1. **Assignees + Tickets** — which offshore teammate(s) to tag and which ticket(s) each gets.
2. **Config Version** — per ticket. Default: `SJ-<TICKET_ID>-<ITERATION>` (e.g., `SJ-HIS-9001-01`). Only ask if user doesn't specify; infer from Jira description if possible.
3. **Testing Notes** — any extra instructions per ticket (optional). If none, omit that line.

If the user already provided all this inline, skip asking.

## Step 2: Fetch Ticket Details

For each ticket mentioned, call `getJiraIssue` (`cloudId: "horizonpennymac.atlassian.net"`) to retrieve:

- **Summary** (ticket title)
- **Process Version** from the description panel if config version wasn't provided

Jira ticket URL format: `https://horizonpennymac.atlassian.net/browse/<TICKET_ID>`

## Step 3: Compose Separate Messages

Compose one message **per person** — each is sent as its own independent post to the channel.

Template per person:

```
<@SLACK_ID> — These tickets are ready for testing:

• *TICKET_ID* — [Ticket Title] https://horizonpennymac.atlassian.net/browse/TICKET_ID
  Config Version: `SJ-TICKET_ID-01`
  Notes: <testing note, or omit this line if none>

• *TICKET_ID2* — [Ticket Title2] https://horizonpennymac.atlassian.net/browse/TICKET_ID2
  Config Version: `SJ-TICKET_ID2-01`

```

Rules:

- **One message per person** — never combine multiple teammates into one message
- Use `<@SLACK_ID>` syntax for mentions (not `@Name`)
- Bold the ticket ID with `*HIS-XXXX*`
- Only include the Notes line if there are actual testing notes
- Multiple tickets for one person → multiple bullets in their message
- Keep it concise — no filler text beyond what's shown

## Step 4: Preview All Drafts and Confirm

Show all composed messages together in chat (clearly separated), then ask for one confirmation before sending any.

```
📋 Drafts for #team-eligibles-offshore-onshore (N separate messages)

--- Message 1 (Chirag) ---
[message]

--- Message 2 (Sonic) ---
[message]

Send all N messages? (yes / edit)
```

If the user wants edits to any message, update and re-preview all. Do not send until explicitly confirmed.

## Step 5: Send Each Message Separately

After confirmation, call `slack_send_message` once per person, sequentially:

```
slack_send_message(channel_id = "C093GGD044R", message = "<person 1 message>")
slack_send_message(channel_id = "C093GGD044R", message = "<person 2 message>")
// repeat for each person
```

Return all message links to the user after sending.

## Rules

- **Always preview** before sending — never send without confirmation
- **Always tag** by Slack ID (`<@ID>`), never by display name alone
- **Config version** must be present for every ticket — if unknown, ask before sending
- **Do not fetch siblings or parent epics** — only read the tickets explicitly provided

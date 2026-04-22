---
name: transition-jira-ticket
description: Transitions a HIS Jira ticket through the Ready → Dev → QA workflow stages. Handles multi-step transitions and confirms before executing each step. Use when the user says "move to QA", "transition to dev", "send to QA", "ready for dev", or provides a ticket ID with a target status in the Ready/Dev/QA workflow.
---

# Transition Jira Ticket (Ready → Dev → QA)

Transitions HIS tickets through the standard dev workflow: **Ready → Dev → QA**.

All Jira calls require `cloudId = "horizonpennymac.atlassian.net"`.

## Workflow Overview

```
Ready  ──►  Dev  ──►  QA
```

Tickets may need multi-step transitions (e.g., Ready → Dev first, then Dev → QA) if the workflow doesn't allow direct jumps.

---

## Step 1: Fetch the Ticket

```
getJiraIssue(cloudId="horizonpennymac.atlassian.net", issueIdOrKey="HIS-XXXX")
```

Note the **current status** and **assignee**. The current status determines which transitions are available.

---

## Step 2: Determine Required Transition Path

| Current Status | Target | Transition Path |
|----------------|--------|-----------------|
| Ready | Dev | Ready → Dev (single step) |
| Ready | QA | Ready → Dev → QA (two steps) |
| Dev | QA | Dev → QA (single step) |

If the ticket is already at or past the target, inform the user and stop.

---

## Step 3: Discover Available Transition IDs

Transition IDs vary by Jira workflow configuration — **never hard-code them**. Read the available transitions from the `getJiraIssue` response or attempt a known transition and handle errors.

Common HIS transition names to look for:
- **"Ready for Dev"** / **"Ready"** → moving ticket to Ready status
- **"In Dev"** / **"Dev"** → moving ticket to Dev status
- **"In QA"** / **"QA"** / **"Ready for QA"** → moving ticket to QA status

To find valid transition IDs, inspect the `transitions` array in the `getJiraIssue` response. Match by `name` (case-insensitive).

---

## Step 4: Confirm Before Executing

Show a summary before any transition:

```
Transition Summary:
  Ticket: HIS-XXXX — [Summary]
  Current Status: [Current]
  Target Status: QA
  Path: [e.g., Ready → Dev → QA]
  Assignee: [Name]

Proceed?
```

Wait for user confirmation.

---

## Step 5: Execute Transitions

For each step in the path, call `transitionJiraIssue`:

```
transitionJiraIssue(
  cloudId = "horizonpennymac.atlassian.net",
  issueIdOrKey = "HIS-XXXX",
  transitionId = "[ID]"
)
```

If a step fails with a "field required" error, ask the user for the required field and retry.

After each step, confirm the status updated before proceeding to the next.

---

## Step 6: Final Report

```
✅ Ticket Transitioned: HIS-XXXX
   Summary: [Summary]
   Previous Status: [Old]
   New Status: QA
   Link: https://horizonpennymac.atlassian.net/browse/HIS-XXXX
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Transition not available | List valid transitions and ask user to confirm which to use |
| Required field missing | Ask user for the value, then retry |
| Permission denied | Inform user, verify ticket is in HIS project |
| Ticket already at target | Inform user, no action taken |

## Rules

- **Never make any updates** to parent tickets or Epics — they are strictly read-only
- **Never fetch any other tickets from an Epic** — only fetch the single ticket ID explicitly provided by the user; do not retrieve siblings, children, or any other linked issues

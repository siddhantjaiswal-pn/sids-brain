# Skills Index

All agent skills available in this workspace, grouped by domain. Skills are triggered automatically when the described scenarios match.

---

## Vesta

| Skill | What it does | Trigger phrases |
|---|---|---|
| [`sync-vesta-config`](sync-vesta-config/SKILL.md) | Syncs the Vesta config knowledge base — refreshes objectives list, index, and task files | "sync Vesta config", "refresh objectives", "update knowledge base", "get details for objective X" |
| [`compare-vesta-tasks`](compare-vesta-tasks/SKILL.md) | Compares a task definition across two process versions, saves markdown files, and diffs them | "compare tasks between versions", "diff this task", "how did X change in version Y vs Z" |
| [`create-vesta-loan`](create-vesta-loan/SKILL.md) | Creates a Vesta purchase loan via the local loancreate API (localhost:3001) | "make me a vesta loan", "create a purchase loan", "spin up a loan", "fire a loan in dev/stg" |

---

## Jira

### Creating & Editing Tickets

| Skill | What it does | Trigger phrases |
|---|---|---|
| [`create-jira-ticket`](create-jira-ticket/SKILL.md) | Creates a new HIS story or bug with the standard ADF template | "create a ticket", "new ticket", "add a story", "log a bug" |
| [`update-jira-ticket`](update-jira-ticket/SKILL.md) | Stamps the ADF description template onto an existing ticket | "update ticket", "apply template", "stamp the template", "fill in the description for HIS-XXXX" |
| [`verify-jira-ticket`](verify-jira-ticket/SKILL.md) | Validates all fields and description sections against team standards, fixes issues interactively | "verify ticket", "validate ticket", "check ticket", "audit HIS-XXXX" |
| [`write-gherkin-acs`](write-gherkin-acs/SKILL.md) | Writes numbered Gherkin (Given/When/Then) acceptance criteria to a ticket's AC field | "write ACs", "add acceptance criteria", "write gherkin", "stamp ACs for HIS-XXXX" |

### Workflow Transitions

| Skill | What it does | Trigger phrases |
|---|---|---|
| [`transition-jira-ticket`](transition-jira-ticket/SKILL.md) | Moves a ticket through Ready → Dev → QA with confirmation at each step | "move to QA", "transition to dev", "ready for dev", "send HIS-XXXX to QA" |

---

## Team Communication

| Skill | What it does | Trigger phrases |
|---|---|---|
| [`notify-offshore-team`](notify-offshore-team/SKILL.md) | Posts ticket assignments to `#team-eligibles-offshore-onshore` Slack, tagging Chirag / Sonic / Vibha / Ravi | "notify offshore", "ping offshore", "send to offshore", "let the team know" |

---

## Composite Workflows

These skills chain multiple steps together in a single command.

| Skill | What it does | Trigger phrases |
|---|---|---|
| [`qa-and-notify`](qa-and-notify/SKILL.md) | Transitions a ticket to QA **and** sends the offshore Slack notification in one pass | "move to QA and notify", "QA and ping offshore", "send to QA and notify the team" |

---

## Notes

- Project skills live in `.cursor/skills/` (this folder).
- `create-vesta-loan` is also symlinked at `~/.cursor/skills/` so it works across all projects.
- To add a new skill, see the [create-skill guide](~/.cursor/skills-cursor/create-skill/SKILL.md) or say _"create a skill for…"_.

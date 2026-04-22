# Sid's Brain

A personal knowledge base and AI-assisted workspace for Pennymac HIS team work. It stores structured context — Vesta configuration, team data, proposals, and automation scripts — so that Cursor AI agents can operate with full, reliable context.

---

## Structure

```
Sids Brain/
├── Vesta/                    # Vesta LOS configuration knowledge base
│   ├── admin-config.md       # Overview of Vesta admin config concepts
│   └── config/
│       └── objectives/       # Per-objective README + task files (synced locally)
├── Proposals/                # Strategy and proposal documents
├── Team/                     # Team member reference (Jira IDs, Slack IDs)
├── scripts/                  # Automation scripts
│   ├── sync-vesta-config.py  # Syncs Vesta config from API into markdown
│   └── objectives-list.json  # Cached list of all Vesta objectives
├── canvas/                   # Cursor canvas visualizations
├── apendix/                  # Reference data and spreadsheets
└── .cursor/                  # Cursor AI configuration (skills, MCP, rules)
```

---

## Key Areas

### Vesta Configuration (`Vesta/`)
Structured markdown representation of the active Vesta Loan Origination System (LOS) configuration. Objectives, tasks, validations, and admin config concepts are stored here so AI agents can reference them without needing direct access to the Vesta UI.

The `Vesta/` directory is intentionally excluded from version control (see `.gitignore`) since it is synced locally from the live system.

### Scripts (`scripts/`)
- **`sync-vesta-config.py`** — Two-phase sync script that pulls Vesta configuration from the API and writes it as markdown files.
  - Phase 1 (`--index-only`): Refreshes `objectives-list.json` and `Vesta/config/objectives/index.md`
  - Phase 2 (default): Calls the config API per-objective and writes `README.md` + task files

### Team (`Team/`)
Reference file with all team members' Jira account IDs and Slack user IDs, used by AI skills that create tickets or send notifications.

### Proposals (`Proposals/`)
Strategy documents, including the AI-first Vesta configuration proposal that describes converting Vesta admin config into versioned markdown as a foundation for AI-assisted development.

---

## Cursor AI Skills

This workspace contains custom Cursor AI skills (`.cursor/skills/`) for common team workflows:

| Skill | Purpose |
|---|---|
| `create-jira-ticket` | Creates HIS project Jira stories and bugs |
| `update-jira-ticket` | Applies standard ADF templates to existing tickets |
| `verify-jira-ticket` | Validates ticket fields and description completeness |
| `transition-jira-ticket` | Moves tickets through Ready → Dev → QA stages |
| `qa-and-notify` | Transitions to QA and notifies the offshore team |
| `notify-offshore-team` | Sends Slack notifications to the offshore team |
| `write-gherkin-acs` | Writes Gherkin acceptance criteria to a ticket |
| `sync-vesta-config` | Triggers a Vesta config sync from the API |

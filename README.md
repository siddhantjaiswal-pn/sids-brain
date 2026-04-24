# Sid's Brain

A personal knowledge base and AI-assisted workspace for Pennymac HIS team work. It stores structured context — Vesta configuration, team data, proposals, and automation scripts — so that Cursor AI agents can operate with full, reliable context.

---

## Structure

```
Sids Brain/
├── Vesta/                          # Vesta LOS configuration knowledge base
│   ├── admin-config.md             # Overview of Vesta admin config concepts
│   ├── Proxy Server/               # Proxy server documentation
│   └── config/
│       └── objectives/             # Per-objective README + task files (synced locally)
│           ├── index.md            # Master index of all 180+ objectives
│           ├── initial-eligibility-review/
│           ├── final-eligibility-review/
│           ├── additional-initial-eligibility-review/
│           ├── additional-final-eligibility-review/
│           ├── agent-low-doc-review/
│           ├── low-doc-review/
│           ├── additional-low-doc-review/
│           ├── income-review/
│           ├── asset-review/
│           ├── guideline-review/
│           ├── loan-restructure/
│           ├── generate-underwriting-package/
│           └── ... (180+ objectives total, 1150+ task markdown files)
│
├── Proposals/                      # Strategy and proposal documents
│   └── ai-first-config-strategy.md # AI-first Vesta config proposal
│
├── Team/                           # Team member reference
│   └── my-team.md                  # Jira account IDs and Slack user IDs
│
├── scripts/                        # Automation scripts
│   ├── sync-vesta-config.py        # Two-phase Vesta config sync from API
│   └── objectives-list.json        # Cached list of all Vesta objectives
│
├── canvas/                         # Cursor canvas visualizations
│   └── agent-escalation-findings.canvas.tsx
│
├── apendix/                        # Reference data and spreadsheets
│   └── Agent Data (4).xlsx         # Agent performance data
│
└── .cursor/                        # Cursor AI configuration
    ├── mcp.json                    # MCP server configuration
    ├── plans/                      # AI agent plan files
    │   └── filter_recent_process_versions.plan.md
    └── skills/                     # Custom AI skills for team workflows
        ├── create-jira-ticket/
        │   ├── SKILL.md
        │   └── templates/
        │       ├── bug-adf.md
        │       └── story-adf.md
        ├── update-jira-ticket/
        │   ├── SKILL.md
        │   └── templates/
        │       ├── bug-adf.md
        │       └── story-adf.md
        ├── verify-jira-ticket/
        │   ├── SKILL.md
        │   └── checks.md
        ├── transition-jira-ticket/
        │   └── SKILL.md
        ├── qa-and-notify/
        │   └── SKILL.md
        ├── notify-offshore-team/
        │   └── SKILL.md
        ├── write-gherkin-acs/
        │   └── SKILL.md
        └── sync-vesta-config/
            └── SKILL.md
```

---

## Key Areas

### Vesta Configuration (`Vesta/`)
Structured markdown representation of the active Vesta Loan Origination System (LOS) configuration. Contains:
- **`admin-config.md`** — Core Vesta admin concepts (objectives, tasks, validations, etc.)
- **`config/objectives/`** — 180+ objectives with detailed task markdown files (1150+ total files)
- **`config/objectives/index.md`** — Master index of all objectives with UUIDs and metadata
- **`Proxy Server/`** — Proxy server documentation for API access

Objectives, tasks, validations, and admin config concepts are stored here so AI agents can reference them without needing direct access to the Vesta UI.

The `Vesta/` directory is intentionally excluded from version control (see `.gitignore`) since it is synced locally from the live system using `sync-vesta-config.py`.

### Scripts (`scripts/`)
- **`sync-vesta-config.py`** — Two-phase sync script that pulls Vesta configuration from the API and writes it as markdown files.
  - Phase 1 (`--index-only`): Refreshes `objectives-list.json` and `Vesta/config/objectives/index.md` with all 180+ objectives
  - Phase 2 (default): Calls the config API per-objective and writes `README.md` + task files + automated action files
  - Can fetch objectives from specific process versions by name or UUID
- **`objectives-list.json`** — Cached list of all Vesta objectives (updated by Phase 1)

### Team (`Team/`)
- **`my-team.md`** — Reference file with all team members' Jira account IDs and Slack user IDs, used by AI skills that create tickets or send notifications

### Proposals (`Proposals/`)
- **`ai-first-config-strategy.md`** — Strategy document describing the AI-first Vesta configuration approach: converting Vesta admin config into versioned markdown as a foundation for AI-assisted development

### Canvas (`canvas/`)
- **`agent-escalation-findings.canvas.tsx`** — Interactive visualization of agent escalation data and findings

### Apendix (`apendix/`)
- **`Agent Data (4).xlsx`** — Agent performance and metrics spreadsheet

### Cursor Configuration (`.cursor/`)
AI configuration and customization for Cursor IDE:
- **`mcp.json`** — MCP (Model Context Protocol) server configuration for integrations
- **`plans/`** — AI agent planning documents for complex multi-step tasks
- **`skills/`** — Custom AI skills for team workflows (see Cursor AI Skills section below)

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

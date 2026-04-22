---
name: sync-vesta-config
description: >
  Syncs the Vesta configuration knowledge base. Phase 1 (fast): calls the objective-list
  endpoint, refreshes objectives-list.json with all 180+ objectives, and rebuilds index.md.
  Phase 2 (deep): calls get-config per objective to write README.md + task files +
  automated action files (automatedActionTemplates).
  Use when the user says "sync Vesta config", "refresh objectives", "update the index",
  "update knowledge base", "sync objective details", or "get details for objective {name}".
---

# Sync Vesta Config Knowledge Base

Two-phase sync for the Vesta objective configuration knowledge base.

**Phase 1 — Index sync** (fast, ~1 sec): Calls the objective-list endpoint, auto-updates
`objectives-list.json` with all current objectives, and rebuilds `Vesta/objectives/index.md`.
UUIDs are discovered automatically — no manual ID management needed.

**Phase 2 — Detail sync** (slow, minutes): Calls `get-config` per objective and writes
full `README.md` + individual task `.md` files.

## Trigger Phrases → Workflow

| User says | Workflow |
|-----------|----------|
| "refresh index", "update index", "sync index" | [Phase 1 Only](#phase-1--index-sync) |
| "sync all", "full sync", "sync Vesta config" | [Phase 1 + Phase 2](#phase-1--2-full-sync) |
| "sync objective {name}" | [Single Objective Detail](#single-objective-detail) |
| "what's the process version UUID?" | Read `scripts/sync-vesta-config.py` and show `PROCESS_VERSION_UUID` |
| "update process version UUID to {uuid}" | [Update Process Version UUID](#update-process-version-uuid) |

---

## Phase 1 — Index Sync

```bash
python3 "scripts/sync-vesta-config.py" --index-only
```

Reports: `{N} objectives found`, `objectives-list.json updated`, `index.md written`.

---

## Phase 1 + 2 — Full Sync

```bash
python3 "scripts/sync-vesta-config.py"
```

This fetches detail for **all** objectives. With 180 objectives it takes several minutes.
Warn the user upfront. After completion, report total objectives, tasks, and validations written.

---

## Single Objective Detail

When the user wants detail files for just one objective by name:

1. Read `scripts/objectives-list.json` to find the UUID for that objective name.
2. Run the index sync first to ensure the list is fresh:
   ```bash
   python3 "scripts/sync-vesta-config.py" --index-only
   ```
3. Then fetch and write just that objective's detail:
   ```bash
   cd "/Users/sijaiswal/Sids Brain" && python3 -c "
   import importlib.util
   spec = importlib.util.spec_from_file_location('sync_vesta_config', 'scripts/sync-vesta-config.py')
   mod = importlib.util.module_from_spec(spec)
   spec.loader.exec_module(mod)
   obj = mod.fetch_objective('{uuid}')
   ext_id = obj.get('externalIdentifier') or mod.to_kebab(obj['name'])
   slug = mod.to_kebab(ext_id)
   obj_dir = mod.OBJECTIVES_DIR / slug
   tasks_dir = obj_dir / 'tasks'
   obj_dir.mkdir(parents=True, exist_ok=True)
   tasks_dir.mkdir(parents=True, exist_ok=True)
   all_tasks_map = {t['id']: t for t in obj.get('taskTemplates', [])}
   rows = []
   for t in obj.get('taskTemplates', []):
       s = mod.write_task_file(t, tasks_dir, all_tasks_map)
       rows.append((t['name'], t['taskTemplateType'], t.get('entityType',''), t.get('triggerMethod',''), '—', '—', s))
   auto_rows = []
   for a in obj.get('automatedActionTemplates', []):
       s = mod.write_automated_action_slug(a, tasks_dir)
       auto_rows.append((a['name'], a.get('entityType',''), a.get('actionType',''), s))
   mod.write_objective_readme(obj, obj_dir, rows, auto_rows)
   print(f'Done: {obj[\"name\"]} — {len(rows)} task(s), {len(auto_rows)} automated action(s)')
   "
   ```

   > **Note**: `importlib.util` is required — `sys.path.insert` fails because
   > `sync-vesta-config.py` uses hyphens and cannot be imported as a Python module.

---

## Update Process Version UUID

When the user says "the process version changed" or provides a new UUID:

1. Read `scripts/sync-vesta-config.py`
2. Replace the default value of `PROCESS_VERSION_UUID`
3. Run Phase 1 to verify the new UUID works

---

## File Structure

```
scripts/
  objectives-list.json        ← auto-managed registry (180 objectives, refreshed by Phase 1)
  sync-vesta-config.py        ← sync script

Vesta/objectives/
  index.md                    ← master table (180 rows, from list endpoint only)
  {objective-slug}/           ← only exists for detail-synced objectives
    README.md                 ← relevance, readiness, tasks, automated actions, validations
    tasks/
      {task-slug}.md          ← type-specific task detail + relevance logic
      {action-slug}.md        ← AutomatedAction: runs automatically, has actionType + execution conditions
```

## Notes

- `objectives-list.json` is **auto-managed** by Phase 1 — never edit manually.
- `index.md` is built from the list endpoint only — no detail calls needed.
- Objectives with detail pages are hyperlinked in `index.md`; others show as plain text.
- Slugs are derived from `externalIdentifier` (camelCase → kebab-case), which is stable.
- If the local API (`localhost:3001`) is not running, start it before syncing.

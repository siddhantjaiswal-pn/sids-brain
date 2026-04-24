---
name: sync-vesta-config
description: >
  Syncs the Vesta configuration knowledge base. Phase 1 (fast): calls the objective-list
  endpoint, refreshes objectives-list.json with all 180+ objectives, and rebuilds index.md.
  Phase 2 (deep): calls get-objective per objective to write README.md + task files +
  automated action files (automatedActionTemplates). Also handles fetching objectives from
  specific process versions by name or UUID — uses the config-list endpoint to resolve
  process version names to UUIDs, then fetches the objectives list and details.
  Use when the user says "sync Vesta config", "refresh objectives", "update the index",
  "update knowledge base", "sync objective details", "get details for objective {name}",
  "get {objective} from process version {uuid}", or "get {objective} from process version {name}".
---

# Sync Vesta Config Knowledge Base

Two-phase sync for the Vesta objective configuration knowledge base.

**Phase 1 — Index sync** (fast, ~1 sec): Calls the objective-list endpoint, auto-updates
`objectives-list.json` with all current objectives, and rebuilds `Vesta/objectives/index.md`.
UUIDs are discovered automatically — no manual ID management needed.

**Phase 2 — Detail sync** (slow, minutes): Calls `get-objective` per objective and writes
full `README.md` + individual task `.md` files.

## Trigger Phrases → Workflow

| User says | Workflow |
|-----------|----------|
| "refresh index", "update index", "sync index" | [Phase 1 Only](#phase-1--index-sync) |
| "sync all", "full sync", "sync Vesta config" | [Phase 1 + Phase 2](#phase-1--2-full-sync) |
| "sync objective {name}" | [Single Objective Detail](#single-objective-detail) |
| "get {objective name} from process version {uuid}" | [Objective from Specific Process Version](#objective-from-specific-process-version) |
| "get {objective name} from process version {name}" | [Resolve Process Version Name to UUID](#resolve-process-version-name-to-uuid) → [Objective from Specific Process Version](#objective-from-specific-process-version) |
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

## Resolve Process Version Name to UUID

When the user provides a **process version name** (e.g., "SJ-HIS-RestrictedSkillset-04") instead of a UUID, use this workflow to resolve it:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
import urllib.request

BASE_URL = 'http://localhost:3001'
PROCESS_VERSION_NAME = '{process_version_name}'

url = f'{BASE_URL}/adhoc/config-list'
print(f'Searching for process version: {PROCESS_VERSION_NAME}')
print()

with urllib.request.urlopen(url, timeout=30) as resp:
    versions = json.loads(resp.read().decode('utf-8'))

matches = [v for v in versions if v['name'] == PROCESS_VERSION_NAME]

if not matches:
    print(f'ERROR: Process version \"{PROCESS_VERSION_NAME}\" not found.')
    print(f'Available versions in the last week ({len(versions)} total):')
    for v in versions[:20]:  # Show first 20
        print(f'  - {v[\"name\"]} (id: {v[\"id\"]})')
else:
    match = matches[0]
    print(f'Found: {match[\"name\"]}')
    print(f'UUID: {match[\"id\"]}')
    print(f'Status: {match[\"status\"]}')
    print(f'Last Modified: {match[\"configLastModifiedAt\"]}')
    print()
    print(f'Use this UUID in the next step: {match[\"id\"]}')
"
```

Replace `{process_version_name}` with the exact process version name provided by the user.

**Next step**: Once you have the UUID, proceed to [Objective from Specific Process Version](#objective-from-specific-process-version) using the resolved UUID.

**Note**: The `/adhoc/config-list` endpoint returns process versions modified in the last week. If the version is not found, it may be older than 1 week.

---

## Objective from Specific Process Version

**CRITICAL**: When the user provides a process version UUID and wants objective details, you **MUST** follow this exact 3-step workflow:

> **Tip**: If you only have a process version **name** (not UUID), see [Resolve Process Version Name to UUID](#resolve-process-version-name-to-uuid) first.

### Step 1: Fetch objectives list from the process version

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
import urllib.request

PROCESS_VERSION_UUID = '{process_version_uuid}'
BASE_URL = 'http://localhost:3001'

url = f'{BASE_URL}/adhoc/objective-list?processVersionUUID={PROCESS_VERSION_UUID}'
print(f'Fetching objectives from process version: {PROCESS_VERSION_UUID}')
print()

with urllib.request.urlopen(url, timeout=30) as resp:
    objectives = json.loads(resp.read().decode('utf-8'))

print(f'Total objectives found: {len(objectives)}')
print()

# Find the requested objective by name
search_term = '{objective_name}'.lower()
for obj in objectives:
    if search_term in obj['name'].lower():
        print(f\"Name: {obj['name']}\")
        print(f\"UUID: {obj['id']}\")
        print(f\"External ID: {obj.get('externalIdentifier', 'N/A')}\")
        print()
"
```

Replace `{process_version_uuid}` with the provided process version UUID and `{objective_name}` with the objective name to search for.

### Step 2: Extract the UUID from Step 1 output

From the output above, identify the correct UUID for the objective.

### Step 3: Fetch objective details using the UUID

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import importlib.util

spec = importlib.util.spec_from_file_location('sync_vesta_config', 'scripts/sync-vesta-config.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# Fetch the objective using the UUID from Step 2
obj = mod.fetch_objective('{uuid_from_step_2}')

ext_id = obj.get('externalIdentifier') or mod.to_kebab(obj['name'])
slug = mod.to_kebab(ext_id)
print(f'Objective: {obj[\"name\"]}')
print(f'Slug: {slug}')
print(f'UUID: {obj[\"id\"]}')
print(f'External ID: {obj.get(\"externalIdentifier\", \"N/A\")}')
print(f'Tasks: {len(obj.get(\"taskTemplates\", []))}')
print(f'Automated Actions: {len(obj.get(\"automatedActionTemplates\", []))}')
print()

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
print(f'Files written to: {obj_dir}')
"
```

Replace `{uuid_from_step_2}` with the UUID extracted from Step 2.

### Why This Workflow?

Each process version has its own set of objective UUIDs. You **cannot** use a UUID from `objectives-list.json` (which is tied to the default process version) when querying a different process version. You must:

1. ✅ First get the objectives list from the specific process version
2. ✅ Find the correct UUID for that objective in that version
3. ✅ Then fetch the objective details

**DO NOT** skip Step 1 and go directly to fetching objective details with a cached UUID.

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

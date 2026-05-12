---
name: sync-vesta-config
description: >
  Syncs a Vesta objective into the knowledge base from a config.json file the user has already
  placed in the objective's folder. Never makes API calls — reads config.json directly from
  Vesta/config/objectives/{objective-slug}/config.json and writes all task .md files.
  Use when the user says "sync Vesta config", "sync objective", "process this objective",
  "process the config", "create the files", or names an objective folder.
---

# Sync Vesta Config Knowledge Base

Writes objective task files from a `config.json` the user has already placed in the objective folder.

**No API calls are ever made.** The user creates the folder and drops the JSON file in it.

---

## Workflow

### Step 1: Identify the objective folder

The user will have already created a folder at:

```
Vesta/config/objectives/{objective-slug}/config.json
```

If the user hasn't told you the folder name, ask:

> "What is the objective folder name?"

### Step 2: Process the config and write task files

Replace `{objective-slug}` with the actual folder name, then run:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
import importlib.util

spec = importlib.util.spec_from_file_location('sync_vesta_config', '.cursor/skills/sync-vesta-config/sync-vesta-config.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

config_path = mod.OBJECTIVES_DIR / '{objective-slug}' / 'config.json'
with open(config_path, 'r') as f:
    obj = json.load(f)

ext_id = obj.get('externalIdentifier') or mod.to_kebab(obj['name'])
slug = mod.to_kebab(ext_id)
print(f'Objective: {obj[\"name\"]}')
print(f'Slug: {slug}')
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

> **Note**: `importlib.util` is required — `sys.path.insert` fails because
> `sync-vesta-config.py` uses hyphens and cannot be imported directly as a Python module.

### Step 3: Report results

After the script completes, tell the user:
- Objective name and slug
- Number of task files written
- Number of automated action files written
- Path where files were saved

---

## File Structure

```
Vesta/config/objectives/
  {objective-slug}/
    config.json               ← user places this file before running the skill
    README.md                 ← written by this skill
    tasks/
      {task-slug}.md          ← written by this skill
      {action-slug}.md        ← written by this skill (AutomatedAction tasks)
```

## Notes

- The `config.json` file is **never modified** — it is read-only input.
- Existing `README.md` and task files in the objective directory are overwritten.
- Slugs are derived from `externalIdentifier` (camelCase → kebab-case), which is stable.
- If the script fails to load, verify `.cursor/skills/sync-vesta-config/sync-vesta-config.py` exists.

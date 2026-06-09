---
name: sync-vesta-config
description: >
  Syncs a Vesta objective into the knowledge base from a config.json file the user has already
  placed in Vesta/config/objectives/. Never makes API calls — reads config.json, derives the
  objective folder name from the config, and writes all task .md files.
  Use when the user says "sync Vesta config", "sync objective", "process this objective",
  "process the config", "create the files", or names an objective folder.
---

# Sync Vesta Config Knowledge Base

Writes objective task files from a `config.json` the user has already placed in the objective folder.

**No API calls are ever made.** The user creates the folder and drops the JSON file in it.

---

## Workflow

### Step 1: Confirm the config file is in place

The user will have already dropped `config.json` directly into:

```
Vesta/config/objectives/config.json
```

The script reads the objective name from inside the config and creates (or updates) the correct
subfolder automatically — no need to ask the user for a folder name.

### Step 2: Process the config and write task files

Run:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
import importlib.util

spec = importlib.util.spec_from_file_location('sync_vesta_config', '.cursor/skills/sync-vesta-config/sync-vesta-config.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

config_path = mod.OBJECTIVES_DIR / 'config.json'
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

all_tasks = obj.get('taskTemplates', [])
all_tasks_map = {t['id']: t for t in all_tasks}

id_to_filename = {}
for i, t in enumerate(all_tasks, 1):
    t_ext_id = t.get('externalIdentifier') or mod.to_kebab(t['name'])
    id_to_filename[t['id']] = f\"{i:02d}-{mod.to_kebab(t_ext_id)}\"

rows = []
for i, t in enumerate(all_tasks, 1):
    s = mod.write_task_file(t, tasks_dir, all_tasks_map, idx=i, id_to_filename=id_to_filename)
    rows.append((t['name'], t['taskTemplateType'], t.get('entityType',''), t.get('triggerMethod',''), '—', '—', s))

auto_rows = []
for i, a in enumerate(obj.get('automatedActionTemplates', []), 1):
    s = mod.write_automated_action_slug(a, tasks_dir, idx=i)
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
  config.json                 ← user drops this file here before running the skill
  {objective-slug}/
    README.md                 ← written by this skill
    tasks/
      {NN}-{task-slug}.md     ← written by this skill (NN = 1-based position in config)
      {NN}-{action-slug}.md   ← written by this skill (AutomatedAction tasks)
```

## Notes

- The `config.json` file is **never modified** — it is read-only input.
- The objective subfolder name is derived automatically from `externalIdentifier` in the config (camelCase → kebab-case).
- Existing `README.md` and task files in the objective directory are overwritten on re-sync.
- Instructions task files contain only the raw checklist step text — no heading or numbered prefix.
- If the script fails to load, verify `.cursor/skills/sync-vesta-config/sync-vesta-config.py` exists.

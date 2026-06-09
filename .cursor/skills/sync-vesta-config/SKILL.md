---
name: sync-vesta-config
description: >
  Syncs a Vesta objective into the knowledge base from a config.json file. On first run, creates
  the Vesta/config/objectives/ folder and a blank config.json so the user knows exactly where to
  paste their export. On subsequent runs, reads config.json, derives the objective folder name,
  and writes all task .md files. Never makes API calls.
  Use when the user says "sync Vesta config", "sync objective", "process this objective",
  "process the config", "create the files", or names an objective folder.
---

# Sync Vesta Config Knowledge Base

Scaffolds the folder structure and writes objective task files from a `config.json`.

**No API calls are ever made.** On first run the skill creates the folder and a blank `config.json`
so the user knows exactly where to paste their export. On re-run it processes the config and writes
all task files.

---

## Workflow

### Step 1: Scaffold the folder and config file (if not already in place)

Run this first to create the folder structure and a blank `config.json` if they don't exist yet:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
from pathlib import Path

objectives_dir = Path('Vesta/config/objectives')
config_path = objectives_dir / 'config.json'

objectives_dir.mkdir(parents=True, exist_ok=True)

if not config_path.exists():
    config_path.write_text('{}', encoding='utf-8')
    print('Scaffold created.')
    print(f'  Folder : {objectives_dir}')
    print(f'  Config : {config_path}')
    print()
    print('Next step: paste your exported Vesta objective JSON into:')
    print(f'  {config_path}')
    print('Then re-run the skill to process it.')
else:
    try:
        obj = json.loads(config_path.read_text(encoding='utf-8'))
        if not obj or not obj.get('name'):
            print('config.json exists but appears empty or missing required fields.')
            print('Please paste your exported Vesta objective JSON into:')
            print(f'  {config_path}')
            print('Then re-run the skill to process it.')
        else:
            print(f'config.json already in place (objective: {obj[\"name\"]}). Proceeding to process.')
    except json.JSONDecodeError:
        print('config.json exists but contains invalid JSON. Please check the file and try again.')
"
```

If the scaffold was just created, **stop here** — paste the exported Vesta config JSON into `Vesta/config/objectives/config.json`, then re-run the skill.

### Step 2: Process the config and write task files

Run once `config.json` is populated:

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
  config.json                 ← created blank by Step 1 if missing; user fills it in before Step 2
  {objective-slug}/
    README.md                 ← written by this skill
    tasks/
      {NN}-{task-slug}.md     ← written by this skill (NN = 1-based position in config)
      {NN}-{action-slug}.md   ← written by this skill (AutomatedAction tasks)
```

## Notes

- **Step 1 is safe to run at any time** — it only creates the folder and a blank `config.json` if they don't already exist. It never overwrites an existing `config.json`.
- The `config.json` file is **never modified** by Step 2 — it is read-only input.
- The objective subfolder name is derived automatically from `externalIdentifier` in the config (camelCase → kebab-case).
- Existing `README.md` and task files in the objective directory are overwritten on re-sync.
- Instructions task files contain only the raw checklist step text — no heading or numbered prefix.
- If the script fails to load, verify `.cursor/skills/sync-vesta-config/sync-vesta-config.py` exists.

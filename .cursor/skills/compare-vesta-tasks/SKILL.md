---
name: compare-vesta-tasks
description: >
  Compares task definitions from different Vesta process versions. Fetches task details
  from two process versions, saves them as markdown files, and shows differences.
  Use when the user wants to compare tasks between versions, diff configurations,
  or analyze how task definitions changed across process versions.
---

# Compare Vesta Tasks

Compares a specific task from two different Vesta process versions by fetching details from each version, saving them as separate markdown files, and showing the differences.

## Usage

When the user provides:
- Two process version names (e.g., "SJ-HIS-8897-03" and "V1240 4/22")
- Task name (e.g., "Loan Amount Validation")
- Objective name (e.g., "Agent Low Doc Review")

Follow this workflow.

## Workflow

### Step 1: Resolve Process Version Names to UUIDs

For each process version name, resolve it to a UUID:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
import urllib.request

BASE_URL = 'http://localhost:3001'
PROCESS_VERSION_NAME = '{version_name}'

url = f'{BASE_URL}/adhoc/config-list'
with urllib.request.urlopen(url, timeout=30) as resp:
    versions = json.loads(resp.read().decode('utf-8'))

matches = [v for v in versions if v['name'] == PROCESS_VERSION_NAME]

if not matches:
    print(f'ERROR: Process version \"{PROCESS_VERSION_NAME}\" not found.')
    print(f'Available versions ({len(versions)} total):')
    for v in versions[:20]:
        print(f'  - {v[\"name\"]} (id: {v[\"id\"]})')
else:
    match = matches[0]
    print(f'Found: {match[\"name\"]}')
    print(f'UUID: {match[\"id\"]}')
"
```

Run this twice in parallel - once for each process version.

### Step 2: Find Objective UUIDs in Each Version

For each process version UUID, find the objective UUID:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
import urllib.request

PROCESS_VERSION_UUID = '{process_version_uuid}'
BASE_URL = 'http://localhost:3001'

url = f'{BASE_URL}/adhoc/objective-list?processVersionUUID={PROCESS_VERSION_UUID}'

with urllib.request.urlopen(url, timeout=30) as resp:
    objectives = json.loads(resp.read().decode('utf-8'))

search_term = '{objective_name}'.lower()
for obj in objectives:
    if search_term in obj['name'].lower():
        print(f\"Name: {obj['name']}\")
        print(f\"UUID: {obj['id']}\")
        print(f\"External ID: {obj.get('externalIdentifier', 'N/A')}\")
"
```

Run this twice in parallel - once for each process version UUID.

### Step 3: Fetch Task Details from Each Version

For each objective UUID, fetch the full details and save the task:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import json
import urllib.request

BASE_URL = 'http://localhost:3001'
OBJECTIVE_ID = '{objective_uuid}'

url = f'{BASE_URL}/adhoc/get-objective?objectiveId={OBJECTIVE_ID}'

with urllib.request.urlopen(url, timeout=30) as resp:
    obj = json.loads(resp.read().decode('utf-8'))

search_term = '{task_name}'.lower()
for task in obj.get('taskTemplates', []):
    if search_term in task['name'].lower():
        print(f\"Found task: {task['name']}\")
        print(f\"Task UUID: {task['id']}\")
        with open('/tmp/task_{safe_version_name}.json', 'w') as f:
            json.dump(task, f, indent=2)
        print('Task saved')
        break
"
```

Run this twice in parallel - once for each objective UUID.

### Step 4: Convert to Markdown and Save

Create the output directory and convert tasks to markdown:

```bash
cd "/Users/sijaiswal/Sids Brain" && python3 -c "
import importlib.util
import json
from pathlib import Path

# Load the sync script
spec = importlib.util.spec_from_file_location('sync_vesta_config', 'scripts/sync-vesta-config.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# Create output directory
output_dir = Path('/Users/sijaiswal/Sids Brain/{output_directory_name}')
output_dir.mkdir(parents=True, exist_ok=True)

# Load tasks
with open('/tmp/task_version1.json', 'r') as f:
    task1 = json.load(f)
with open('/tmp/task_version2.json', 'r') as f:
    task2 = json.load(f)

# Write files with version names
target1 = output_dir / '{version1_filename}.md'
target2 = output_dir / '{version2_filename}.md'

# Get task type and use appropriate writer
task_type = task1.get('taskTemplateType', '')
writer = mod.TASK_WRITERS.get(task_type, mod.write_unknown_task)

writer(task1, target1)
writer(task2, target2)

print(f'✓ Version 1 written to: {target1}')
print(f'✓ Version 2 written to: {target2}')
"
```

### Step 5: Clean Up (Optional)

If the user wants only checklist steps, remove headers and footers:

```python
# Remove everything except "## Checklist Steps" section
# Use StrReplace to remove metadata sections at top and bottom
```

### Step 6: Show Diff

Run diff to show differences:

```bash
cd "/Users/sijaiswal/Sids Brain/{output_directory_name}" && diff -u {version1_filename}.md {version2_filename}.md
```

## Output

The skill creates:
- A new directory with a descriptive name (e.g., "loan amount validation")
- Two markdown files named after the process versions (e.g., "SJ-HIS-8897-03.md", "V1240-4-22.md")
- A diff output showing the changes between versions

## Key Points

- Process version names must be exact matches
- If a version is not found in the last week's changes, it may be too old
- The skill uses the same markdown formatting as `sync-vesta-config.py`
- Task types (Instructions, DocumentProcessing, etc.) are automatically handled by the appropriate writer function
- The diff output uses unified format (-u) for clear change visualization

## Common Patterns

### Major vs Minor Changes

When summarizing the diff for the user, categorize changes as:
- **Major changes**: Logic changes, new steps, removed constraints, different targets
- **Minor changes**: Formatting, wording, metadata updates
- **Additions**: New logging, validation, or requirements
- **Removals**: Deleted steps or constraints

### Directory Naming

Use descriptive names that match the task being compared:
- Task name in lowercase with spaces (e.g., "loan amount validation")
- Avoid generic names like "comparison" or "diff"

### File Naming

Use the exact process version names for file names:
- Replace special characters with hyphens (e.g., "V1240 4/22" → "V1240-4-22.md")
- Keep it recognizable to the original version name

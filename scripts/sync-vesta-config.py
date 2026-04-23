#!/usr/bin/env python3
"""
sync-vesta-config.py

Two-phase sync for the Vesta configuration knowledge base:

  Phase 1 — Index sync (fast, no detail calls):
      Calls the objective-list endpoint, refreshes objectives-list.json,
      and writes Vesta/objectives/index.md.

  Phase 2 — Detail sync (optional, per objective):
      Calls get-objective for each objective sequentially (never in parallel),
      with a 4-second delay between calls, and writes README.md + task .md files.

Usage:
    python3 scripts/sync-vesta-config.py            # Phase 1 + Phase 2
    python3 scripts/sync-vesta-config.py --index-only  # Phase 1 only

Environment variables:
    VESTA_BASE_URL            — defaults to http://localhost:3001
    VESTA_PROCESS_VERSION_UUID — process version UUID for the list endpoint
                                 (defaults to the last known value; update when
                                 the version changes)
"""

import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path
from typing import Optional

# Delay between sequential detail-endpoint calls (seconds).
# All detail fetches are strictly sequential — never parallel.
DETAIL_CALL_DELAY_SECONDS = 4

BASE_URL = os.environ.get("VESTA_BASE_URL", "http://localhost:3001")

# This UUID identifies the active process version. Update VESTA_PROCESS_VERSION_UUID
# env var (or edit the default below) when the version is rotated.
PROCESS_VERSION_UUID = os.environ.get(
    "VESTA_PROCESS_VERSION_UUID",
    "f7ea095c-6465-4d8c-afb2-7e1410651fbc",
)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
OBJECTIVES_LIST_PATH = Path(__file__).resolve().parent / "objectives-list.json"
OBJECTIVES_DIR = WORKSPACE_ROOT / "Vesta" / "config" / "objectives"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def to_kebab(s: str) -> str:
    """Convert camelCase or any string to stable kebab-case slug."""
    s = re.sub(r"([A-Z])", r"-\1", s)
    s = re.sub(r"[^a-z0-9]+", "-", s.lower())
    return s.strip("-")


def parse_condition_value(raw: str) -> str:
    """Return a human-readable display value from a raw conditionValue string."""
    if not raw:
        return ""
    if raw.startswith("["):
        try:
            return "[" + ", ".join(str(x) for x in json.loads(raw)) + "]"
        except Exception:
            return raw
    if raw.startswith("{"):
        try:
            obj = json.loads(raw)
            if "value" in obj and "type" in obj:
                return f"{obj['value']} {obj['type']}"
        except Exception:
            pass
    return raw


def render_condition(c: dict) -> str:
    """Render a single condition dict as a readable bullet string."""
    model = c.get("modelType", "")
    field = c.get("fieldName", "")
    condition = c.get("condition", "")
    raw_value = c.get("conditionValue", "")
    linked_model = c.get("linkedModelType", "")
    linked_field = c.get("linkedFieldName", "")
    list_cond = c.get("listCondition", "")
    doc_type = c.get("documentTypeName", "")

    if doc_type:
        subject = f"Document type `{doc_type}`"
    elif model and field:
        subject = f"`{model}.{field}`"
    else:
        subject = f"`{field}`"

    linked_part = f" → `{linked_model}.{linked_field}`" if (linked_model and linked_field) else ""
    list_prefix = f"({list_cond}) " if list_cond else ""
    value_part = f" `{parse_condition_value(raw_value)}`" if raw_value else ""

    return f"- {list_prefix}{subject}{linked_part} **{condition}**{value_part}"


def render_condition_groups(groups: list) -> str:
    """
    Render condition groups as human-readable markdown.
    Multiple groups = OR between groups; conditions within a group = AND.
    """
    if not groups:
        return "_Always applicable_"

    blocks = []
    for i, group in enumerate(groups):
        conditions = group.get("conditions", [])
        if not conditions:
            continue
        if len(groups) > 1:
            blocks.append(f"**OR — Condition Set {i + 1}** (all must be true):")
        lines = [render_condition(c) for c in conditions]
        blocks.append("\n".join(lines))

    return "\n\n".join(blocks) if blocks else "_Always applicable_"


def fetch_objective_list(process_version_uuid: str) -> list[dict]:
    """Call the objective-list endpoint and return all objectives as a list."""
    url = f"{BASE_URL}/adhoc/objective-list?processVersionUUID={process_version_uuid}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_objective(obj_id: str) -> dict:
    """Call the get-objective endpoint for a single objective (full detail)."""
    url = f"{BASE_URL}/adhoc/get-objective?objectiveId={obj_id}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


# ---------------------------------------------------------------------------
# Task file writers (one per taskTemplateType)
# ---------------------------------------------------------------------------

def _task_header(task: dict, extra_lines: list[str]) -> list[str]:
    """Common opening block shared by every task type (and automated actions)."""
    name = task["name"]
    ext_id = task.get("externalIdentifier", "")
    # Tasks use lastModifiedAt; automated actions use lastUpdated.
    last_mod = (task.get("lastModifiedAt") or task.get("lastUpdated") or "")[:10]
    last_by = task.get("lastModifiedBy", "")

    lines = [f"# {name}", ""]
    lines += extra_lines

    # Metadata footer first so type-specific content follows cleanly
    if ext_id or last_mod:
        lines += [""]
        if ext_id:
            lines.append(f"_External ID: `{ext_id}`_  ")
        if last_mod:
            lines.append(f"_Last modified: {last_mod} by {last_by}_")

    lines += [""]
    rel_groups = task.get("relevanceConditionGroups", [])
    lines += ["## Relevance", "", render_condition_groups(rel_groups), ""]

    return lines


def write_instructions_task(task: dict, path: Path) -> None:
    trigger = task.get("triggerMethod", "—")
    ai = "enabled" if task.get("aiAgentEnabled") else "disabled"
    disable_manual = "yes" if task.get("disableManualSubmission") else "no"
    auto_reopen = "yes" if task.get("automaticallyReopensUponObjectiveScenarioChangeReopen") else "no"
    entity = task.get("entityType", "")

    header_lines = [
        f"**Type**: Instructions | **Entity**: {entity} | **Trigger**: {trigger} | **AI Agent**: {ai}  ",
        f"**Disable Manual Submission**: {disable_manual} | **Auto-Reopens on Scenario Change**: {auto_reopen}",
    ]
    lines = _task_header(task, header_lines)

    entries = task.get("templateChecklistEntries", [])
    lines += ["## Checklist Steps", ""]
    if entries:
        for i, entry in enumerate(entries, 1):
            step_text = entry.get("name", "").strip().replace("\n", "  \n   ")
            lines.append(f"**{i}.** {step_text}")
            step_rel = entry.get("relevanceConditionGroups", [])
            if step_rel:
                lines.append(f"   > _Step shown when:_ {render_condition_groups(step_rel)}")
            lines.append("")
    else:
        lines.append("_No checklist steps configured_")
        lines.append("")

    comp_groups = task.get("completionConditionGroups", [])
    lines += ["## Completion Conditions", "", render_condition_groups(comp_groups), ""]

    path.write_text("\n".join(lines), encoding="utf-8")


def write_document_processing_task(task: dict, path: Path) -> None:
    entity = task.get("entityType", "")
    doc_id = task.get("documentTypeId", "")
    doc_status = task.get("documentStatusOnCompletion", "")
    auto_complete = "yes" if task.get("autoCompleteTask") else "no"
    allow_add = "yes" if task.get("allowAddWork") else "no"
    instructions_override = task.get("instructionsOverride", "")

    header_lines = [
        f"**Type**: DocumentProcessing | **Entity**: {entity} | **Document Type ID**: `{doc_id}`  ",
        f"**Status on Completion**: {doc_status} | **Auto-Complete**: {auto_complete} | **Allow Add Work**: {allow_add}",
    ]
    if instructions_override:
        header_lines.append(f"**Instructions Override**: {instructions_override}")

    lines = _task_header(task, header_lines)

    entity_configs = task.get("documentEntityTypeConfigurations", [])
    lines += ["## Document Entity Configurations", ""]
    if entity_configs:
        lines += [
            "| Order | Entity | Field Count |",
            "|-------|--------|-------------|",
        ]
        for cfg in sorted(entity_configs, key=lambda x: x.get("order", 0)):
            field_count = len(cfg.get("documentTypeFieldConfigurations", []))
            lines.append(f"| {cfg.get('order', '')} | {cfg.get('entityType', '')} | {field_count} |")
    else:
        lines.append("_No entity configurations_")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def write_document_required_task(task: dict, path: Path) -> None:
    entity = task.get("entityType", "")
    trigger = task.get("triggerMethod", "—")
    auto_complete = "yes" if task.get("autoCompleteTask") else "no"
    ext_msg = task.get("externalMessage", "")
    cond_tmpl = task.get("conditionTemplate") or {}
    timing = cond_tmpl.get("timing", "")
    category = cond_tmpl.get("category", "")

    configs = task.get("configurations", [])
    req_count = configs[0].get("numberOfRequiredDocumentTypes", "") if configs else ""
    distinct = "yes" if (configs and configs[0].get("requireDistinctDocumentTypes")) else "no"
    allowed_ids = configs[0].get("allowedDocumentTypeIds", []) if configs else []

    header_lines = [
        f"**Type**: DocumentRequired | **Entity**: {entity} | **Trigger**: {trigger}  ",
        f"**Required Count**: {req_count} | **Require Distinct Types**: {distinct} | **Auto-Complete**: {auto_complete}",
    ]
    if timing or category:
        header_lines.append(f"**Condition Template**: {timing} / {category}")
    if ext_msg:
        header_lines.append(f"**External Message**: {ext_msg}")

    lines = _task_header(task, header_lines)

    if allowed_ids:
        lines += ["## Allowed Document Type IDs", "", ", ".join(str(x) for x in allowed_ids), ""]

    path.write_text("\n".join(lines), encoding="utf-8")


def write_manual_document_request_task(task: dict, path: Path, all_tasks_map: dict) -> None:
    entity = task.get("entityType", "")
    instruction_obj = task.get("instruction") or {}
    instruction_text = instruction_obj.get("instruction", "")
    suggested_page = instruction_obj.get("suggestedPage", "")
    linked_ids = task.get("documentRequiredTaskTemplateOptionIds", [])

    header_lines = [f"**Type**: ManualDocumentRequest | **Entity**: {entity}"]
    if instruction_text:
        header_lines.append(f"**Instruction**: {instruction_text}")
    if suggested_page:
        header_lines.append(f"**Suggested Page**: `{suggested_page}`")

    if linked_ids:
        links = []
        for lid in linked_ids:
            linked_task = all_tasks_map.get(lid)
            if linked_task:
                linked_ext = linked_task.get("externalIdentifier") or to_kebab(linked_task["name"])
                linked_slug = to_kebab(linked_ext)
                links.append(f"[{linked_task['name']}]({linked_slug}.md)")
            else:
                links.append(f"`{lid}`")
        header_lines.append(f"**Linked DocumentRequired Option IDs**: {', '.join(links)}")

    lines = _task_header(task, header_lines)
    path.write_text("\n".join(lines), encoding="utf-8")


def write_input_required_task(task: dict, path: Path) -> None:
    entity = task.get("entityType", "")
    auto_complete = "yes" if task.get("autoCompleteTask") else "no"
    additional = task.get("additionalInstructions", "")

    header_lines = [f"**Type**: InputRequired | **Entity**: {entity} | **Auto-Complete**: {auto_complete}"]
    if additional:
        header_lines.append(f"**Additional Instructions**: {additional}")

    lines = _task_header(task, header_lines)

    form_rows = task.get("formRows", [])
    lines += ["## Form Fields", ""]
    if form_rows:
        lines += [
            "| Field | Model | Required | Read-Only |",
            "|-------|-------|----------|-----------|",
        ]
        for row in sorted(form_rows, key=lambda x: x.get("order", 0)):
            lines.append(
                f"| {row.get('fieldName', '')} | {row.get('modelType', '')} "
                f"| {'yes' if row.get('isRequired') else 'no'} "
                f"| {'yes' if row.get('isReadOnly') else 'no'} |"
            )
    else:
        lines.append("_No form fields configured_")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def write_unknown_task(task: dict, path: Path) -> None:
    task_type = task["taskTemplateType"]
    entity = task.get("entityType", "")
    header_lines = [f"**Type**: {task_type} | **Entity**: {entity}"]
    lines = _task_header(task, header_lines)
    path.write_text("\n".join(lines), encoding="utf-8")


def write_automated_action_file(action: dict, path: Path) -> None:
    """Write a single automated action .md file."""
    entity = action.get("entityType", "")
    action_type = action.get("actionType", "")
    package_name = action.get("packageName", "")
    std_package = action.get("standardPackageType", "")
    sent_to_borrowers = action.get("isSentToBorrowers")
    request_type = action.get("requestType", "")

    first_line = f"**Type**: AutomatedAction | **Entity**: {entity}"
    if action_type:
        first_line += f" | **Action Type**: {action_type}"
    parts = [first_line]

    if package_name:
        pkg = package_name
        if std_package and std_package != package_name and std_package != "Undefined":
            pkg += f" ({std_package})"
        parts.append(f"**Package**: {pkg}")
    if sent_to_borrowers is not None:
        parts.append(f"**Sent to Borrowers**: {'yes' if sent_to_borrowers else 'no'}")
    if request_type and request_type != "Undefined":
        parts.append(f"**Request Type**: {request_type}")

    lines = _task_header(action, parts)

    ready_groups = action.get("readinessConditionGroups", [])
    lines += ["## Readiness (Execution Conditions)", "", render_condition_groups(ready_groups), ""]

    path.write_text("\n".join(lines), encoding="utf-8")


def write_automated_action_slug(action: dict, tasks_dir: Path) -> str:
    """Write an automated action .md file and return its slug."""
    slug = to_kebab(action["name"])
    write_automated_action_file(action, tasks_dir / f"{slug}.md")
    return slug


TASK_WRITERS = {
    "Instructions": write_instructions_task,
    "DocumentProcessing": write_document_processing_task,
    "DocumentRequired": write_document_required_task,
    "ManualDocumentRequest": write_manual_document_request_task,
    "InputRequired": write_input_required_task,
}


def write_task_file(task: dict, tasks_dir: Path, all_tasks_map: dict) -> str:
    """Write a single task .md file and return its slug."""
    ext_id = task.get("externalIdentifier") or to_kebab(task["name"])
    slug = to_kebab(ext_id)
    out_path = tasks_dir / f"{slug}.md"

    task_type = task.get("taskTemplateType", "")
    writer = TASK_WRITERS.get(task_type, write_unknown_task)

    if task_type == "ManualDocumentRequest":
        writer(task, out_path, all_tasks_map)
    else:
        writer(task, out_path)

    return slug


# ---------------------------------------------------------------------------
# Objective README
# ---------------------------------------------------------------------------

def write_objective_readme(
    data: dict,
    obj_dir: Path,
    task_rows: list[tuple],
    automated_action_rows: Optional[list[tuple]] = None,
) -> None:
    name = data["name"]
    ext_id = data.get("externalIdentifier", "")
    entity = data.get("entityType", "")
    stages = ", ".join(data.get("readinessLoanStageNames", [])) or "—"
    routing = data.get("objectiveRoutingMethod", "")
    skillsets = ", ".join(data.get("requiredSkillsets", [])) or "—"
    esc_skillsets = ", ".join(data.get("escalatedObjectiveSkillsets", [])) or "—"
    ai_enabled = "enabled" if data.get("aiAgentEnabled") else "disabled"
    auto_ai = "yes" if data.get("shouldAutoAssignToAiAgent") else "no"
    auto_reopen = "yes" if data.get("isAutomaticallyCompletedAndReopened") else "no"
    auto_assign = "yes" if data.get("shouldAutoAssignAssigneeToLoanOnComplete") else "no"
    assigned_as = data.get("assignedToLoanAs", "")
    multipack = "yes" if data.get("shouldAlsoAssignToMultipack") else "no"

    rel_groups = data.get("relevanceConditionGroups", [])
    ready_groups = data.get("readinessConditionGroups", [])
    manual_type = data.get("manualAvailabilityConditionGroupEvaluationType", "Never")
    manual_groups = data.get("manualAvailabilityConditionGroups", [])
    cond_skillset_groups = data.get("conditionalSkillsetGroups", [])
    validations = data.get("validationConfigurations", [])

    lines = [
        f"# {name}",
        "",
        f"**External ID**: `{ext_id}`  ",
        f"**Entity**: {entity}  ",
        f"**Loan Stages**: {stages}  ",
        f"**Routing**: {routing}  ",
        f"**Skillsets**: {skillsets}  ",
        f"**Escalation Skillsets**: {esc_skillsets}  ",
        f"**AI Agent**: {ai_enabled} | **Auto-Assign to AI**: {auto_ai}  ",
        f"**Auto-Complete & Reopen**: {auto_reopen}  ",
        f"**Auto-Assign Assignee on Complete**: {auto_assign}"
        + (f" (as `{assigned_as}`)" if assigned_as else "")
        + f" | **Multipack**: {multipack}",
        "",
    ]

    # Relevance
    lines += ["## Relevance Logic", ""]
    if not rel_groups:
        lines += ["> Objective is **always relevant**", ""]
    elif len(rel_groups) == 1:
        lines += [
            "> Objective becomes **Upcoming** when **ALL** of the following are true:",
            "",
            render_condition_groups(rel_groups),
            "",
        ]
    else:
        lines += [
            f"> Objective becomes **Upcoming** when **ANY** of these {len(rel_groups)} sets are met:",
            "",
            render_condition_groups(rel_groups),
            "",
        ]

    # Readiness
    lines += ["## Readiness Logic", ""]
    if not ready_groups:
        lines += ["> Objective becomes **Open** immediately when relevant", ""]
    elif len(ready_groups) == 1:
        lines += [
            "> Objective becomes **Open** when **ALL** of the following are true:",
            "",
            render_condition_groups(ready_groups),
            "",
        ]
    else:
        lines += [
            f"> Objective becomes **Open** when **ANY** of these {len(ready_groups)} sets are met:",
            "",
            render_condition_groups(ready_groups),
            "",
        ]

    # Manual availability
    if manual_type != "Never":
        lines += ["## Manual Availability", ""]
        if manual_groups:
            lines += [
                "> Can be manually triggered when:",
                "",
                render_condition_groups(manual_groups),
                "",
            ]
        else:
            lines += ["> No specific manual availability conditions configured", ""]

    # Conditional skillset routing
    if cond_skillset_groups:
        lines += [
            "## Conditional Skillset Routing",
            "",
            f"Dynamic skill assignment based on loan data — {len(cond_skillset_groups)} rule(s):",
            "",
            "| Skillset(s) | Key Conditions (summary) |",
            "|-------------|--------------------------|",
        ]
        for g in cond_skillset_groups:
            skillset_names = ", ".join(g.get("skillsetNames", []))
            cg = g.get("conditionGroup") or {}
            conds = cg.get("conditions", [])
            summary_parts = []
            for c in conds[:3]:
                val = parse_condition_value(c.get("conditionValue", ""))
                val_snippet = f" `{val[:40]}`" if val else ""
                summary_parts.append(
                    f"`{c.get('modelType','')}.{c.get('fieldName','')}` {c.get('condition','')}{val_snippet}"
                )
            summary = "; ".join(summary_parts)
            if len(conds) > 3:
                summary += f" _(+{len(conds) - 3} more)_"
            lines.append(f"| {skillset_names} | {summary} |")
        lines.append("")

    # Tasks
    lines += ["## Tasks", ""]
    if task_rows:
        lines += [
            "| Task | Type | Entity | Trigger | Auto-Complete | AI Agent |",
            "|------|------|--------|---------|---------------|----------|",
        ]
        for t_name, t_type, t_entity, t_trigger, t_auto, t_ai, t_slug in task_rows:
            lines.append(
                f"| [{t_name}](tasks/{t_slug}.md) | {t_type} | {t_entity}"
                f" | {t_trigger or '—'} | {t_auto} | {t_ai} |"
            )
    else:
        lines.append("_No tasks configured_")
    lines.append("")

    # Automated Actions
    lines += ["## Automated Actions", ""]
    if automated_action_rows:
        lines += [
            "| Automated Action | Entity | Action Type |",
            "|------------------|--------|-------------|",
        ]
        for a_name, a_entity, a_type, a_slug in automated_action_rows:
            lines.append(f"| [{a_name}](tasks/{a_slug}.md) | {a_entity} | {a_type} |")
    else:
        lines.append("_No automated actions configured_")
    lines.append("")

    # Validations
    lines += ["## Linked Validations", ""]
    if validations:
        lines += [
            "| Validation | Warning Type | Blocks | Entity |",
            "|-----------|-------------|--------|--------|",
        ]
        for v in validations:
            v_name = v.get("validationName", "")
            v_type = v.get("warningType", "")
            v_entity = v.get("entityType", "")
            blocks = ", ".join(a.get("vestaActionType", "") for a in v.get("vestaActions", []))
            lines.append(f"| {v_name} | {v_type} | {blocks} | {v_entity} |")
    else:
        lines.append("_No linked validations_")
    lines.append("")

    (obj_dir / "README.md").write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------
# Master index
# ---------------------------------------------------------------------------

def write_index(list_items: list, detail_synced_slugs: Optional[set] = None) -> None:
    """
    Build index.md from objective-list endpoint data only.
    Links to README.md only for objectives that have been detail-synced.
    """
    total = len(list_items)
    detail_synced_slugs = detail_synced_slugs or set()

    lines = [
        "# Vesta Objectives — Knowledge Base Index",
        "",
        f"_Auto-generated from the objective-list endpoint. {total} objective(s).  ",
        "Do **not** edit manually — run `scripts/sync-vesta-config.py` to refresh._",
        "",
        "| Objective | External ID | Entity | Loan Stages | Tasks | Actions | AI Agent | Auto-Complete | Last Modified |",
        "|-----------|-------------|--------|-------------|-------|---------|----------|---------------|---------------|",
    ]

    for obj in sorted(list_items, key=lambda x: x.get("name", "")):
        name = obj["name"]
        ext_id = obj.get("externalIdentifier", "")
        entity = obj.get("entityType", "")
        stages = ", ".join(obj.get("readinessLoanStageNames", [])) or "—"
        tasks = obj.get("numberOfTaskTemplates", 0)
        actions = obj.get("numberOfAutomatedActions", 0)
        ai = "yes" if obj.get("aiAgentEnabled") else "no"
        auto_comp = "yes" if obj.get("isAutomaticallyCompletedAndReopened") else "no"
        last_mod = (obj.get("lastModifiedAt") or "")[:10]
        slug = to_kebab(ext_id or to_kebab(name))

        # Link to README only if detail files exist
        if slug in detail_synced_slugs:
            name_cell = f"[{name}]({slug}/README.md)"
        else:
            name_cell = name

        lines.append(
            f"| {name_cell} | `{ext_id}` | {entity}"
            f" | {stages} | {tasks} | {actions} | {ai} | {auto_comp} | {last_mod} |"
        )

    lines.append("")
    (OBJECTIVES_DIR / "index.md").write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def sync_index(process_version_uuid: str) -> list:
    """
    Phase 1: Fetch the objective list, refresh objectives-list.json,
    and write index.md. Returns the list items for use in Phase 2.
    """
    print(f"Fetching objective list (processVersionUUID={process_version_uuid}) ...")
    list_items = fetch_objective_list(process_version_uuid)
    print(f"  -> {len(list_items)} objectives found")

    # Refresh objectives-list.json from the live list
    registry = [{"id": obj["id"], "name": obj["name"]} for obj in list_items]
    OBJECTIVES_LIST_PATH.write_text(
        json.dumps(registry, indent=2), encoding="utf-8"
    )
    print(f"  -> objectives-list.json updated ({len(registry)} entries)")

    # Determine which objectives already have detail pages
    detail_synced_slugs = {
        d.name
        for d in OBJECTIVES_DIR.iterdir()
        if d.is_dir() and (d / "README.md").exists()
    } if OBJECTIVES_DIR.exists() else set()

    OBJECTIVES_DIR.mkdir(parents=True, exist_ok=True)
    write_index(list_items, detail_synced_slugs)
    print(f"  -> index.md written ({len(list_items)} rows)")

    return list_items


def sync_details(list_items: list, force: bool = False) -> None:
    """
    Phase 2: For each objective, call get-objective sequentially and write
    README.md + task .md files.

    IMPORTANT: All API calls are strictly sequential — never parallel.
    A fixed delay of DETAIL_CALL_DELAY_SECONDS is applied between each
    call to avoid overwhelming the local API.

    Skip logic (unless force=True):
      If Vesta/objectives/<slug>/README.md already exists on disk, the objective
      is considered fully synced and is skipped. This serves as both a cross-run
      memory (previously synced objectives are not re-fetched) and a crash-resume
      mechanism (objectives written before a crash are skipped on restart).
    """
    total = len(list_items)
    total_tasks = 0
    total_automated_actions = 0
    total_validations = 0
    total_skipped = 0
    detail_synced_slugs: set[str] = set()

    for i, obj in enumerate(list_items, 1):
        obj_id = obj["id"]
        obj_name = obj["name"]

        # Derive slug from list-endpoint data (same logic as detail path)
        ext_id = obj.get("externalIdentifier") or to_kebab(obj_name)
        slug = to_kebab(ext_id)
        obj_dir = OBJECTIVES_DIR / slug

        # Skip if already synced and --force not requested
        if not force and (obj_dir / "README.md").exists():
            print(f"[{i}/{total}] Skipping (already synced): {obj_name}")
            detail_synced_slugs.add(slug)
            total_skipped += 1
            continue

        print(f"[{i}/{total}] Fetching detail: {obj_name} ...")

        data = fetch_objective(obj_id)

        ext_id = data.get("externalIdentifier") or to_kebab(data["name"])
        slug = to_kebab(ext_id)

        obj_dir = OBJECTIVES_DIR / slug
        tasks_dir = obj_dir / "tasks"
        obj_dir.mkdir(parents=True, exist_ok=True)
        tasks_dir.mkdir(parents=True, exist_ok=True)

        all_tasks_map = {t["id"]: t for t in data.get("taskTemplates", [])}

        task_rows = []
        for task in data.get("taskTemplates", []):
            t_slug = write_task_file(task, tasks_dir, all_tasks_map)
            t_type = task["taskTemplateType"]
            t_entity = task.get("entityType", "")
            t_trigger = task.get("triggerMethod", "—")
            t_auto = "yes" if task.get("autoCompleteTask") else ("—" if "autoCompleteTask" not in task else "no")
            t_ai = "yes" if task.get("aiAgentEnabled") else ("—" if "aiAgentEnabled" not in task else "no")
            task_rows.append((task["name"], t_type, t_entity, t_trigger, t_auto, t_ai, t_slug))
            total_tasks += 1

        automated_action_rows = []
        for action in data.get("automatedActionTemplates", []):
            a_slug = write_automated_action_slug(action, tasks_dir)
            a_entity = action.get("entityType", "")
            a_type = action.get("actionType", "")
            automated_action_rows.append((action["name"], a_entity, a_type, a_slug))
            total_automated_actions += 1

        write_objective_readme(data, obj_dir, task_rows, automated_action_rows)
        total_validations += len(data.get("validationConfigurations", []))
        detail_synced_slugs.add(slug)

        print(
            f"  -> {len(task_rows)} task(s), {len(automated_action_rows)} automated action(s)"
            f" written to {obj_dir.relative_to(WORKSPACE_ROOT)}"
        )

        # Sequential-only: wait before the next detail call (skip delay after the last item).
        # Only delay after a real fetch — skipped objectives don't count.
        remaining = [o for o in list_items[i:] if force or not (OBJECTIVES_DIR / to_kebab(o.get("externalIdentifier") or to_kebab(o["name"])) / "README.md").exists()]
        if remaining:
            print(f"  (waiting {DETAIL_CALL_DELAY_SECONDS}s before next call ...)")
            time.sleep(DETAIL_CALL_DELAY_SECONDS)

    # Re-fetch list and re-write index with updated detail slugs
    print("\nRe-fetching objective list for final index rebuild ...")
    full_list = fetch_objective_list(PROCESS_VERSION_UUID)
    write_index(full_list, detail_synced_slugs)

    fetched = len(list_items) - total_skipped
    print(f"\nDone!")
    print(f"  Objectives fetched           : {fetched}")
    print(f"  Objectives skipped           : {total_skipped}")
    print(f"  Total tasks written          : {total_tasks}")
    print(f"  Total automated actions      : {total_automated_actions}")
    print(f"  Total validations            : {total_validations}")
    print(f"  Index                        : Vesta/config/objectives/index.md")


def main() -> None:
    index_only = "--index-only" in sys.argv
    force = "--force" in sys.argv

    # Phase 1: always run
    list_items = sync_index(PROCESS_VERSION_UUID)

    if index_only:
        print("\nIndex-only mode — skipping detail sync.")
        print(f"Done! {len(list_items)} objectives in index.md")
        return

    if force:
        print("\n--force: re-syncing all objectives regardless of existing files.")

    # Phase 2: detail sync for all objectives
    sync_details(list_items, force=force)


if __name__ == "__main__":
    main()

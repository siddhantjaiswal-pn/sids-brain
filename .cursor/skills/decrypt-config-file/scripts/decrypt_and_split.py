#!/usr/bin/env python3
"""
Decrypt a Vesta .pve config export (base64-encoded) and split it into
per-section JSON files plus a navigation index.

Usage:
    python3 decrypt_and_split.py <path/to/file.pve> [output_dir]

If output_dir is omitted, files are written next to the .pve file.
"""

import sys, os, json, base64

PREFIX = "VESTA_ADMIN_CONFIGURATION_EXPORT:"

SECTION_ORDER = [
    "CustomFields",
    "LoanStages",
    "DocumentTypes",
    "DocumentTypeFields",
    "FactTemplates",
    "ComputedFieldTemplates",
    "ValidationConfigurations",
    "AutomatedActionTemplates",
    "ObjectiveTemplates",
    "ObjectivePriorityRules",
    "ObjectiveBlockedAndEscalatedReasons",
    "ConfigurableDocumentTemplates",
    "FeesManagerConditions",
    "UnderwritingPolicies",
    "ConfigurationTests",
    "TaskTemplates",
    "Conditions",
    "AgentPersonas",
]


def slugify(name: str) -> str:
    return name.replace(" ", "_").replace("/", "-")


def main():
    if len(sys.argv) < 2:
        print("Usage: decrypt_and_split.py <file.pve> [workspace_root]", file=sys.stderr)
        sys.exit(1)

    pve_path       = sys.argv[1]
    workspace_root = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
    base_name      = os.path.splitext(os.path.basename(pve_path))[0]  # e.g. "V1252 5_07 05-08-2026 1-02pm"

    # ── 1. decode ────────────────────────────────────────────────────────────
    print(f"Reading {pve_path} ...")
    with open(pve_path, "rb") as f:
        raw = f.read()

    decoded = base64.b64decode(raw).decode("utf-8")
    if decoded.startswith(PREFIX):
        decoded = decoded[len(PREFIX):]

    print("Parsing JSON ...")
    data = json.loads(decoded)

    version_export  = data.get("VersionExport", {})
    non_versioned   = data.get("NonVersionedExport", {})
    version_name    = version_export.get("Name", base_name)
    version_id      = version_export.get("Id", "")
    
    # ── 2. determine output directory ────────────────────────────────────────
    # Extract version folder name (e.g., V1252, V4732) from version_name
    # version_name is typically like "V1252 5_07" — take everything before the first space
    version_folder = version_name.split()[0] if version_name else "Unknown"
    output_dir = os.path.join(workspace_root, "decrypted-configs", version_folder)
    safe_name = slugify(base_name)

    # ── 3. full pretty-printed file ──────────────────────────────────────────
    os.makedirs(output_dir, exist_ok=True)
    print(f"Output directory: {output_dir}")
    
    full_path = os.path.join(output_dir, f"{safe_name}-full.json")
    print(f"Writing full config → {full_path} ...")
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    full_size_mb = os.path.getsize(full_path) / 1_048_576

    # ── 4. sections directory ────────────────────────────────────────────────
    sections_dir = os.path.join(output_dir, f"{safe_name}-sections")
    os.makedirs(sections_dir, exist_ok=True)

    # metadata
    metadata = {
        "ExportVersion": data.get("ExportVersion"),
        "VersionName":   version_name,
        "VersionId":     version_id,
        "DefaultLoanStageTemplateId": version_export.get("DefaultLoanStageTemplateId"),
        "ScalarFields": {k: v for k, v in version_export.items() if not isinstance(v, (list, dict))},
    }
    with open(os.path.join(sections_dir, "00-metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    # ensure any extra list keys not in SECTION_ORDER are appended
    ordered = list(SECTION_ORDER)
    for k, v in version_export.items():
        if isinstance(v, list) and k not in ordered:
            ordered.append(k)

    index_rows = []
    for i, section in enumerate(ordered, start=1):
        value = version_export.get(section)
        if value is None or not isinstance(value, list):
            continue
        fname = f"{i:02d}-{section}.json"
        fpath = os.path.join(sections_dir, fname)
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(value, f, indent=2, ensure_ascii=False)
        size_kb = os.path.getsize(fpath) / 1024
        print(f"  {fname}  ({len(value)} items, {size_kb:.0f} KB)")
        index_rows.append((fname, section, len(value), size_kb))

    # non-versioned refs
    refs = non_versioned.get("Refs")
    if refs is not None:
        refs_path = os.path.join(sections_dir, "XX-NonVersionedRefs.json")
        with open(refs_path, "w", encoding="utf-8") as f:
            json.dump(refs, f, indent=2, ensure_ascii=False)
        count  = len(refs) if isinstance(refs, list) else "n/a"
        size_kb = os.path.getsize(refs_path) / 1024
        print(f"  XX-NonVersionedRefs.json  ({count} items, {size_kb:.0f} KB)")
        index_rows.append(("XX-NonVersionedRefs.json", "NonVersionedExport.Refs", count, size_kb))

    # ── 5. INDEX.md ───────────────────────────────────────────────────────────
    index_path = os.path.join(output_dir, f"{safe_name}-INDEX.md")
    print(f"Writing index → {index_path} ...")
    lines = [
        f"# Vesta Config Export — {version_name}",
        "",
        f"**Export Version:** {data.get('ExportVersion')}  ",
        f"**Version ID:** `{version_id}`  ",
        f"**Default Loan Stage Template ID:** {version_export.get('DefaultLoanStageTemplateId')}",
        "",
        f"**Full file:** [`{os.path.basename(full_path)}`]({os.path.basename(full_path)}) ({full_size_mb:.1f} MB)",
        "",
        "---",
        "",
        "## Sections",
        "",
        "| # | File | Section | Items | Size |",
        "|---|------|---------|------:|-----:|",
    ]
    for fname, section, count, size_kb in index_rows:
        rel = f"{os.path.basename(sections_dir)}/{fname}"
        lines.append(f"| — | [`{fname}`]({rel}) | `{section}` | {count} | {size_kb:.0f} KB |")

    lines += [
        "",
        "---",
        "",
        "## Scalar fields in VersionExport",
        "",
        "| Field | Value |",
        "|-------|-------|",
    ]
    for k, v in version_export.items():
        if not isinstance(v, (list, dict)):
            lines.append(f"| `{k}` | {v} |")
    lines.append("")

    with open(index_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"\nDone. Files written to: {output_dir}")
    print(f"  Full JSON : {os.path.basename(full_path)} ({full_size_mb:.1f} MB)")
    print(f"  Sections  : {os.path.basename(sections_dir)}/  ({len(index_rows)} files)")
    print(f"  Index     : {os.path.basename(index_path)}")


if __name__ == "__main__":
    main()

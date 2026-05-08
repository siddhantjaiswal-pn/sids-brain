---
name: decrypt-config-file
description: Decrypts a Vesta Admin Configuration Export (.pve file, base64-encoded), splits it into per-section JSON files, and writes a navigation index .md file. Use when the user says "decrypt config", "decrypt .pve", "process this config export", "split the config file", or provides a .pve file and wants it decoded and organized.
---

# Decrypt Config File

Decodes a Vesta `.pve` export (base64 + `VESTA_ADMIN_CONFIGURATION_EXPORT:` prefix), writes a full pretty-printed JSON, splits every VersionExport array into numbered section files, and generates an INDEX.md navigation guide.

## Steps

1. **Identify the `.pve` file** — use the path the user provides or the most recently mentioned `.pve` file.

2. **Run the script** — always pass the workspace root path:

```bash
python3 "/Users/sijaiswal/Sids Brain/.cursor/skills/decrypt-config-file/scripts/decrypt_and_split.py" "<path/to/file.pve>" "/Users/sijaiswal/Sids Brain"
```

The script will:
- Decode the config and extract the version name (e.g., `V1252`, `V4732`)
- Create `decrypted-configs/{VersionName}/` at the workspace root
- Write all output files into that version-specific folder

3. **Confirm output** — the script prints the output directory path and a summary. Tell the user:
   - The version-specific folder path (e.g., `decrypted-configs/V1252/`)
   - Path to the full JSON (`*-full.json`)
   - Sections directory (`*-sections/`) with item counts for major arrays
   - Path to the index (`*-INDEX.md`)

## Output structure

```
/Users/sijaiswal/Sids Brain/
  decrypted-configs/
    V1252/                           ← version-specific folder
      V1252_5_07_...-full.json       ← complete config, pretty-printed
      V1252_5_07_...-INDEX.md        ← navigation guide with item counts
      V1252_5_07_...-sections/
        00-metadata.json             ← version info + scalar fields
        01-CustomFields.json
        02-LoanStages.json
        03-DocumentTypes.json
        ...
        XX-NonVersionedRefs.json
```

## Notes

- The script handles both the `VESTA_ADMIN_CONFIGURATION_EXPORT:` prefix and raw base64.
- Sections with 0 items (e.g. TaskTemplates when not exported) still produce files — that is expected.
- If the `.pve` file is very large (>10 MB), the script may take a few seconds; that is normal.

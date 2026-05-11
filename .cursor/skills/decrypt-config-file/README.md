# Decrypt Config File Skill

A Cursor AI skill that decrypts Vesta Admin Configuration Export files (.pve), splits them into organized JSON sections, and creates a navigation index.

## Installation

1. Copy this entire `decrypt-config-file` folder to your Cursor skills directory:
   ```
   .cursor/skills/decrypt-config-file/
   ```

2. The skill will be automatically detected by Cursor AI.

## What This Skill Does

- Decodes base64-encoded `.pve` files (Vesta Admin Configuration Exports)
- Extracts the version name (e.g., `V1252`, `V4732`)
- Writes a complete pretty-printed JSON file
- Splits configuration into numbered section files for easy navigation
- Generates an INDEX.md with item counts and file sizes
- Organizes everything into version-specific folders

## Requirements

- Python 3.x (standard library only — no external dependencies)
- Cursor AI with Agent/Skills enabled

## Usage

Just ask Cursor AI to decrypt a config file:

```
"Decrypt this config file: V1252.pve"
"Process this .pve export"
"Decrypt config V4732.pve"
```

The skill will automatically:
1. Find the Python script relative to its installation location
2. Process the .pve file
3. Create output in your workspace at `decrypted-configs/{VersionName}/`

## Output Structure

```
<your-workspace>/
  decrypted-configs/
    V1252/
      V1252_5_07_...-full.json       ← Complete configuration
      V1252_5_07_...-INDEX.md        ← Navigation guide
      V1252_5_07_...-sections/       ← Split sections
        00-metadata.json
        01-CustomFields.json
        02-LoanStages.json
        03-DocumentTypes.json
        ...
```

## Manual Script Usage

You can also run the Python script directly:

```bash
python3 .cursor/skills/decrypt-config-file/scripts/decrypt_and_split.py \
  path/to/file.pve \
  /path/to/workspace
```

## License

This skill is provided as-is for internal use.

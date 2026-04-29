---
name: create-vesta-loan
description: Create a Vesta purchase loan via the loancreate-calls local API (localhost:3001). Automatically computes dynamic dates (closingDate = today + 14 days, tridTriggeredDateTimestamp = today, pdaAcknowledged = today), fetches the default config version live from admin-config, and POSTs the loan payload. Use when the user says things like "make me a vesta loan", "create a purchase loan", "make me a vesta purchase loan in dev", "spin up a loan", "create a loan in dev/stg", "fire a loan", or any variation of creating or submitting a loan in Vesta.
---

# LoanCreate — Create a Loan

## Prerequisites

- `loancreate-calls` server must be running on `localhost:3001`
- JSON payload file must exist at its path (default: `/Users/sijaiswal/Documents/Dev/LC-NextJs/nextjs-loancreate/public/jsons/johnHomeowner-Purchase.json`)

## Fields always computed at runtime (JSON file keeps these empty)

| Field | Value |
|---|---|
| `closingDate` | Today + 14 days (`YYYY-MM-DD`) |
| `tridTriggeredDateTimestamp` | Today (`YYYY-MM-DDT00:00:00.000Z`) |
| `customFields.pdaAcknowledged` | Today (`YYYY-MM-DDT00:00:00.000Z`) |

## Fields injected at runtime (never stored in the JSON file)

| Field | Value |
|---|---|
| `loanOriginator.id` | `7426ba78-984b-4f10-a872-2a58d9d53365` |
| `borrowers[0].emailAddress` | `siddhant.jaiswal+1@pnmac.com` |

## Run the loan creation script

```bash
node "/Users/sijaiswal/Sids Brain/.cursor/skills/create-vesta-loan/scripts/create-loan.js" [jsonFilePath] [env] [actionsJSON]
```

**Defaults:**
- `jsonFilePath` → `/Users/sijaiswal/Documents/Dev/LC-NextJs/nextjs-loancreate/public/jsons/johnHomeowner-Purchase.json`
- `env` → `dev`
- `actionsJSON` → `{"pullCredit":true,"pullCosts":true,"runAus":true}`
- `selectedUserName` → `Sids Agent`
- `isDocUploadEnabled` → `true`

**Examples:**

```bash
# Default — John Homeowner Purchase, dev, all actions
node "/Users/sijaiswal/Sids Brain/.cursor/skills/create-vesta-loan/scripts/create-loan.js"

# Specific JSON, staging
node "/Users/sijaiswal/Sids Brain/.cursor/skills/create-vesta-loan/scripts/create-loan.js" \
  "/path/to/other-payload.json" stg

# Skip credit pull
node "/Users/sijaiswal/Sids Brain/.cursor/skills/create-vesta-loan/scripts/create-loan.js" \
  "" dev '{"pullCredit":false,"pullCosts":true,"runAus":true}'
```

## What the script does

1. Loads the JSON payload from the file
2. Patches `closingDate`, `tridTriggeredDateTimestamp`, `customFields.pdaAcknowledged` with today's computed dates
3. Calls `GET localhost:3001/admin/admin-config?env={env}` to fetch `defaultProcessVersionId`
4. POSTs to `localhost:3001/loans?env={env}&selectedVersionId={defaultVersionId}&isDefaultVersion=true&actions={...}`
5. Prints the resulting `loanId` and `loanNumber` on success

## Expected output

```
closingDate               : 2026-05-12
tridTriggeredDateTimestamp : 2026-04-28T00:00:00.000Z
loanOriginator.id          : 7426ba78-984b-4f10-a872-2a58d9d53365
borrower email             : siddhant.jaiswal+1@pnmac.com
selectedUserName           : Sids Agent
isDocUploadEnabled         : true

Fetching default version (env=dev)...
defaultVersionId        : c171ffb6-6b14-40c8-ab98-2c63cde72fb2

Creating loan...

✅ Loan created successfully!

+──────────────────────────────────+────────────────────────────────────────────+
| Field                            | Value                                      |
+──────────────────────────────────+────────────────────────────────────────────+
| Loan ID                          | ac6d1b3b-d89d-474d-a091-eb0318f4cfcb       |
| Loan Number                      | 7300658400                                 |
+──────────────────────────────────+────────────────────────────────────────────+
| Environment                      | dev                                        |
| Process Version ID               | c171ffb6-6b14-40c8-ab98-2c63cde72fb2       |
+──────────────────────────────────+────────────────────────────────────────────+
| Borrower Email                   | siddhant.jaiswal+1@pnmac.com               |
| Loan Originator ID               | 7426ba78-984b-4f10-a872-2a58d9d53365       |
| Selected User                    | Sids Agent                                 |
| Doc Upload Enabled               | true                                       |
+──────────────────────────────────+────────────────────────────────────────────+
| Closing Date                     | 2026-05-12                                 |
| TRID Triggered Date              | 2026-04-28T00:00:00.000Z                   |
| PDA Acknowledged                 | 2026-04-28T00:00:00.000Z                   |
+──────────────────────────────────+────────────────────────────────────────────+
| Pull Credit                      | true                                       |
| Pull Costs                       | true                                       |
| Run AUS                          | true                                       |
+──────────────────────────────────+────────────────────────────────────────────+
```

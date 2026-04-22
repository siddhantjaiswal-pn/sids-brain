# Verification Checks Reference

Detailed rules for each validation check performed during ticket verification.

## Standard Field Checks

### Summary
- **Field**: `summary`
- **Pass**: Non-empty string
- **Fail**: null, empty, or generic placeholder text

### Assignee
- **Field**: `assignee.accountId`
- **Pass**: Any value set
- **Warn**: Set to someone other than `712020:4ddaaf98-60fb-4b88-8366-1ccb9c511a27` (Siddhant Jaiswal)
- **Fail**: null (no assignee)

### Channel
- **Field**: `customfield_10035`
- **Pass**: Array with at least one entry
- **Default**: `[{"value": "CDL", "id": "10022"}]`
- **Auto-fix**: Set to default CDL if missing

### Work-Stream
- **Field**: `customfield_10036`
- **Pass**: Object with `value` set
- **Default**: `{"value": "Horizon Internal Services", "id": "10024"}`
- **Auto-fix**: Set to default if missing

### Teams
- **Field**: `customfield_10037`
- **Pass**: Array with at least one entry
- **Default**: `[{"value": "Eligibles", "id": "10273"}]`
- **Auto-fix**: Set to default if missing

### Sprint
- **Field**: `customfield_10020`
- **Pass**: Object with `id` set
- **Warn**: Not set (optional — do not auto-fix)

### Story Points
- **Field**: `customfield_10032`
- **Pass**: Numeric value > 0
- **Warn**: Not set (optional — do not auto-fix)

### Parent / Epic Link
- **Field**: `parent.key`
- **Pass**: Set to a valid issue key
- **Warn**: Not set (optional — do not auto-fix)

---

## Description Structure Checks

The description field is an ADF document. Parse `fields.description.content` as an array of nodes.

### How to Detect Sections

**Panel nodes**: `{ "type": "panel", "attrs": { "panelType": "<type>" }, "content": [heading, ...] }`  
Extract heading text from `panel.content[0].content[0].text`.

**Bare heading nodes**: `{ "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "...", "marks": [...] }] }`

**Content after a panel/heading**: The sibling node immediately following the panel/heading in the top-level `content` array (typically a `paragraph` or `orderedList`/`bulletList`).

**Placeholder detection**: A paragraph node whose text content equals `[To be filled in]` (with or without italic marks) is considered a placeholder.

---

## Story Description Checks

### Summary Panel
- **Detect**: `panel` node with `panelType: "note"` where heading text is `"Summary"`
- **Pass**: Node exists
- **Fail**: Node missing

### Summary Content
- **Detect**: `paragraph` node immediately after the Summary panel
- **Pass**: Non-empty text that is NOT `[To be filled in]`
- **Fail**: Missing, empty, or `[To be filled in]`
- **Fix source**: Ask user — "What should the Summary section say?"

### Process Version Panel
- **Detect**: `panel` node with `panelType: "note"` where heading text is `"Process Version to be merged to Release Candidate"`
- **Pass**: Node exists
- **Fail**: Node missing

### Process Version Content
- **Detect**: `paragraph` node immediately after the Process Version panel
- **Pass**: Text matches pattern `SJ-HIS-\d+-\d{2}` (e.g. `SJ-HIS-9000-01`)
- **Fail**: Missing, empty, `[To be filled in]`, or wrong format
- **Fix source**: Ask user for iteration number if wrong format; auto-construct `SJ-<TICKET_ID>-01` if missing entirely

### Action Items Panel
- **Detect**: `panel` node with `panelType: "info"` where heading text is `"Action Items"`
- **Pass**: Node exists
- **Fail**: Node missing

### Action Items Content
- **Detect**: `paragraph` or list node immediately after the Action Items panel
- **Pass**: Any non-empty content (placeholder is flagged as ❌ needing user input)
- **Fail**: Missing or `[To be filled in]`
- **Fix source**: Ask user — "What are the Action Items for this ticket?"

### Acceptance Criteria (customfield_10058)
- **Field**: `customfield_10058`
- **Pass**: ADF doc with `panel` node `panelType: "success"` and heading text `"Acceptance Criteria"`
- **Fail**: Field null/empty or structure missing

### Acceptance Criteria Content
- **Detect**: `paragraph` node after AC panel
- **Pass**: Non-empty and not `[To be filled in]`
- **Fail**: Missing or `[To be filled in]`
- **Fix source**: Ask user — "What are the Acceptance Criteria?"

---

## Bug Description Checks

### Issue Description Heading
- **Detect**: Bare `heading` node (level 1) with `underline` mark and non-empty text (not "Issue Description" — check actual content paragraph instead)
- **Pass**: Bare h1 with underline mark exists AND following paragraph is non-empty
- **Fail**: Missing or paragraph is empty / `[To be filled in]`
- **Fix source**: Ask user — "What is the issue description?"

### Steps to Reproduce
- **Detect**: `panel` node with `panelType: "info"` containing h1 "Steps to Reproduce"
- **Pass**: Panel exists AND following content (orderedList or paragraph) is not `[To be filled in]`
- **Fail**: Panel missing OR content is placeholder
- **Fix source**: Ask user — "What are the steps to reproduce?"

### Expected Results
- **Detect**: `panel` node with `panelType: "success"` containing h1 "Expected Results"
- **Pass**: Panel exists AND following content is not `[To be filled in]`
- **Fail**: Panel missing OR content is placeholder
- **Fix source**: Ask user — "What are the expected results?"

### Actual Results
- **Detect**: `panel` node with `panelType: "warning"` containing h1 "Actual Results"
- **Pass**: Panel exists AND following content is not `[To be filled in]`
- **Fail**: Panel missing OR content is placeholder
- **Fix source**: Ask user — "What are the actual results?"

### Test Data
- **Detect**: `panel` node with `panelType: "note"` containing h1 "Test Data"
- **Pass**: Panel exists AND following content is not `[To be filled in]`
- **Fail**: Panel missing OR content is placeholder
- **Fix source**: Ask user — "What test data should be included?"

---

## ADF Rebuild Rules

When updating the description, always rebuild the **entire** description ADF from scratch using the templates in:
- Story: `/Users/sijaiswal/Sids Brain/.cursor/skills/create-jira-ticket/templates/story-adf.md`
- Bug: `/Users/sijaiswal/Sids Brain/.cursor/skills/create-jira-ticket/templates/bug-adf.md`

Substitute user-provided content in place of `<INSERT POLISHED DESCRIPTION HERE>` and `[To be filled in]` placeholders.

Preserve any content that already passes validation (e.g. if Action Items already has real text, keep it verbatim in the rebuilt doc).

---

## Quick Triage Decision Table

| Situation | Action |
|-----------|--------|
| Field missing, has a default | Auto-fix silently, list in summary |
| Field missing, no default | Ask user |
| Section missing from description | Apply full template (confirm first) |
| Section present but `[To be filled in]` | Ask user to provide content |
| Section present with real content | Mark ✅, preserve as-is |
| Warning field not set | Ask user once, grouped; skip if they say no |

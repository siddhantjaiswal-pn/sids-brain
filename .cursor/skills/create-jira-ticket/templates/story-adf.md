# Story ADF Templates

## Description (with placeholders)

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "panel",
      "attrs": { "panelType": "note" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Summary" }]
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "<INSERT POLISHED DESCRIPTION HERE>"
        }
      ]
    },
    { "type": "paragraph", "content": [] },
    {
      "type": "panel",
      "attrs": { "panelType": "note" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Process Version to be merged to Release Candidate" }]
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "SJ-HIS-<TICKET_ID>-01" }]
    },
    { "type": "paragraph", "content": [] },
    {
      "type": "panel",
      "attrs": { "panelType": "info" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Action Items" }]
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "[To be filled in]",
          "marks": [{ "type": "em" }]
        }
      ]
    }
  ]
}
```

## Acceptance Criteria (customfield_10058)

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "panel",
      "attrs": { "panelType": "success" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Acceptance Criteria" }]
        }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "[To be filled in]",
          "marks": [{ "type": "em" }]
        }
      ]
    }
  ]
}
```

## Notes

- Summary content goes in a paragraph **after** the Summary panel (not inside it)
- Process Version content goes in a paragraph **after** its panel
- Action Items content goes in a paragraph/bullet list **after** its panel
- Acceptance Criteria is a **separate field** (`customfield_10058`), NOT part of description
- Panel colors: Summary & Process Version = purple (`note`), Action Items = blue (`info`), Acceptance Criteria = green (`success`)
- Process Version format: `SJ-<FULL_TICKET_ID>-<ITERATION>` e.g. `SJ-HIS-9000-01`

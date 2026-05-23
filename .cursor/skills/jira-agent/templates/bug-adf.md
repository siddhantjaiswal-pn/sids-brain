# Bug ADF Template

Based on HIS-8783. Each section heading uses an `underline` mark.
Content (paragraph, orderedList, bulletList) always goes **after** its panel as a sibling node.

## Section → Panel Mapping

| Section | Panel Type | Content Type |
|---------|-----------|--------------|
| Issue Description | **No panel** — bare `heading` level 1 | bulletList or paragraph |
| Steps to Reproduce | `info` (blue) | orderedList |
| Expected Results | `success` (green) | bulletList or paragraph |
| Actual Results | `warning` (yellow) | bulletList or paragraph |
| Test Data | `note` (purple) | bulletList or paragraph |

## Description (with placeholders)

```json
{
  "version": 1,
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [
        {
          "type": "text",
          "text": "Issue Description",
          "marks": [{ "type": "underline" }]
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
      "attrs": { "panelType": "info" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [
            {
              "type": "text",
              "text": "Steps to Reproduce",
              "marks": [{ "type": "underline" }]
            }
          ]
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
    },
    { "type": "paragraph", "content": [] },
    {
      "type": "panel",
      "attrs": { "panelType": "success" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [
            {
              "type": "text",
              "text": "Expected Results",
              "marks": [{ "type": "underline" }]
            }
          ]
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
    },
    { "type": "paragraph", "content": [] },
    {
      "type": "panel",
      "attrs": { "panelType": "warning" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [
            {
              "type": "text",
              "text": "Actual Results",
              "marks": [{ "type": "underline" }]
            }
          ]
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
    },
    { "type": "paragraph", "content": [] },
    {
      "type": "panel",
      "attrs": { "panelType": "note" },
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [
            {
              "type": "text",
              "text": "Test Data",
              "marks": [{ "type": "underline" }]
            }
          ]
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

- **Issue Description** uses a bare h1 with `underline` mark — no wrapping panel
- All other 4 sections wrap their h1 (with `underline` mark) inside a panel
- Panel colors: Steps to Reproduce = blue (`info`), Expected Results = green (`success`), Actual Results = yellow (`warning`), Test Data = purple (`note`)
- Use `orderedList` for Steps to Reproduce when user provides numbered steps
- Use `bulletList` for Expected/Actual Results and Test Data when multiple points are provided
- Bugs do NOT have an Acceptance Criteria field
- Use empty `{ "type": "paragraph", "content": [] }` nodes for spacing between sections

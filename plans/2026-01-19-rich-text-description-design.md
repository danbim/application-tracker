# Rich-Text Job Descriptions Design

**Issue:** #1 - Rich-text format
**Date:** 2026-01-19

## Overview

Add support for pasting rich text job descriptions (e.g., from LinkedIn). Convert HTML to Markdown on paste, store markdown, render markdown on view.

## Requirements

1. **Paste conversion:** Auto-detect HTML in clipboard and convert to Markdown
2. **Storage:** Store markdown in existing `description` text column
3. **Display:**
   - Hover popover in job table showing rendered markdown
   - Live preview in add/edit form

## Implementation

### Dependencies

- `turndown` - HTML to Markdown conversion (~3KB gzipped)
- `react-markdown` - Markdown rendering with security defaults

### Data Layer

No database changes required. The existing `description` text column stores markdown.

### Task 1: Add paste handler to job form

**File:** `app/components/job-form.tsx`

- Add `onPaste` handler to description Textarea
- Check for `text/html` MIME type in clipboard
- If HTML detected, convert to markdown using Turndown and insert
- If plain text, allow normal paste behavior

### Task 2: Add markdown preview to job form

**File:** `app/components/job-form.tsx`

- Add collapsible preview section below the description textarea
- Use `react-markdown` to render the current description value
- Update preview as user types/pastes

### Task 3: Add hover popover to job table

**File:** `app/components/job-table.tsx`

- Add Popover component (shadcn) triggered on hover over job title
- Render description as markdown inside popover
- Add max-height with scroll for long descriptions
- Skip popover if description is empty

### Edge Cases

- Plain text paste: works normally (no HTML detected)
- Mixed content: Turndown handles gracefully
- Empty description: preview hidden / popover disabled
- Long descriptions: scrollable container with max-height

## Files Changed

| File | Change |
|------|--------|
| `package.json` | Add turndown, react-markdown dependencies |
| `app/components/job-form.tsx` | Paste handler + markdown preview |
| `app/components/job-table.tsx` | Hover popover with markdown |

## Not Changed

- Database schema (no migration needed)
- Zod validation schemas
- Route handlers

# Job Notes Feature Design

## Overview

Add a comments/notes feature to job openings, allowing users to document their journey through the application process (first impressions, interview prep, salary research, call notes, etc.).

## Data Model

New `jobNotes` table with foreign key relationship to `jobOpenings`:

```typescript
// app/db/schema.ts

export const jobNotes = pgTable("job_notes", {
  id: serial("id").primaryKey(),
  jobOpeningId: integer("job_opening_id")
    .notNull()
    .references(() => jobOpenings.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

- **Cascade delete** - Notes removed when job is deleted
- **content** - Markdown text (no length limit)
- **Timestamps** - Track creation and last edit

## Repository Layer

New `JobNoteRepository` class:

```typescript
// app/repositories/JobNoteRepository.ts

export class JobNoteRepository {
  constructor(private db: DbType) {}

  async findByJobId(jobOpeningId: number)
    // Returns notes ordered by createdAt DESC (newest first)

  async findById(id: number)
    // Single note for editing

  async create(data: { jobOpeningId: number; content: string })
    // Insert new note

  async update(id: number, data: { content: string })
    // Updates content + sets updatedAt

  async delete(id: number)
    // Removes note

  async countByJobIds(jobOpeningIds: number[])
    // Bulk count for job table badges
    // Returns Map<jobOpeningId, count>
}
```

## UI Components

### NotesPanel (Sidebar)

Slide-in panel used on both dashboard and edit page:

- **Dimensions**: ~400px wide, full height, slides from right
- **Behavior**: Overlays content (doesn't push), backdrop closes on click, Escape key closes
- **Header**: Job title + company, close button
- **Add note form**: Textarea at top, submit button
- **Notes list**: Scrollable, newest first
  - Each note: rendered markdown, dual timestamp, edit/delete buttons
  - Edit mode: textarea replaces content, save/cancel buttons

### Timestamp Format

Display both relative and absolute: `"2 hours ago (23.01.2026 - 14:03)"`

### Shared Components

Extract reusable components:

- `NotesList` - Renders list of notes with edit/delete
- `NoteForm` - Textarea + submit for new notes
- `NotesPanel` - Sidebar wrapper using above components

## Job Table Changes

### Note Count Badge

- Display next to job title when count > 0
- Small, muted Badge component
- Example: "Senior Engineer at Acme `3`"

### Row Click Behavior

- Click anywhere on row opens notes sidebar for that job
- **Exceptions**: Status dropdown and edit link retain current behavior (use `e.stopPropagation()`)
- Visual: Row cursor changes to `pointer`

## Edit Page Integration

- "Notes (n)" button in page header opens NotesPanel sidebar
- Same component as dashboard - consistent UX
- Only shown on edit page (`/jobs/$id/edit`), not new job page
- Notes require existing job (foreign key constraint)

## Routes and Actions

### Dashboard (`home.tsx`)

**Loader additions:**
- Fetch note counts for displayed jobs via `countByJobIds`
- Fetch notes for selected job when sidebar opens

**Action intents:**
- `createNote` - Create note for a job
- `updateNote` - Update note content
- `deleteNote` - Remove note

### Edit Page (`jobs.$id.edit.tsx`)

**Loader additions:**
- Fetch notes for the job

**Action intents:**
- Same three note intents

### State Management

- Selected job ID stored in React state (no URL param needed)
- Notes panel uses `useFetcher` for CRUD (no full page reload)

## Summary Table

| Aspect | Decision |
|--------|----------|
| Data model | `jobNotes` table with `id`, `jobOpeningId`, `content`, `createdAt`, `updatedAt` |
| Content | Plain text with markdown rendering |
| Operations | Full CRUD (create, read, update, delete) |
| Display order | Newest first by `createdAt` |
| Timestamps | Dual format: "2 hours ago (23.01.2026 - 14:03)" |
| Dashboard access | Click job row (except edit/status) opens slide-in sidebar |
| Edit page access | "Notes (n)" button opens same sidebar |
| New job page | No notes (job must exist first) |
| Sidebar | 400px, slides from right, overlays content, backdrop closes |
| Table indicator | Badge with note count next to job title (when > 0) |
| Shared components | `NotesPanel`, `NotesList`, `NoteForm` used in both contexts |

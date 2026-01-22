# Project Conventions

## Tech Stack

- **Runtime:** Bun
- **Framework:** React Router v7 (Remix-style)
- **Database:** PostgreSQL with Drizzle ORM
- **UI:** Tailwind CSS + shadcn/ui components
- **Testing:** Vitest (unit), Playwright (E2E)
- **Linting:** Biome

## Project Structure

```
app/
├── components/      # React components (shadcn/ui in ui/)
├── db/              # Database schema, migrations, connection
├── repositories/    # Data access layer (Drizzle queries)
├── services/        # Business logic
├── routes/          # React Router routes (file-based routing)
├── schemas/         # Zod validation schemas
└── lib/             # Utilities
e2e/                 # Playwright E2E tests
plans/               # Design and implementation plans
docs/                # GitHub Pages (landing page only)
```

## Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run typecheck` | Type check |
| `bun run check:fix` | Lint and format (Biome) |
| `bun test` | Unit tests (watch mode) |
| `bun run test:e2e` | E2E tests (Playwright) |
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate` | Run pending migrations |

## Database Workflow

1. Modify schema in `app/db/schema.ts`
2. Run `bun run db:generate` to create migration
3. Run `bun run db:migrate` to apply
4. Add `--> statement-breakpoint` between SQL statements in migrations (required for PGLite E2E tests)

## Testing

- **Unit tests:** Co-locate with source files as `*.test.ts(x)`
- **E2E tests:** In `e2e/` directory, use PGLite (set `TEST_PGLITE=true`)
- Run `bun run test:e2e` to regenerate landing page screenshots

## Code Conventions

- Use existing shadcn/ui components from `app/components/ui/`
- Repository pattern for database access (see `app/repositories/`)
- Zod schemas for form validation (see `app/schemas/`)
- Prefer server-side data loading in route loaders

## Plans and Documentation

Plans and design documents should be saved to `plans/` (not `docs/`).
The `docs/` folder is reserved for GitHub Pages content.

## MCP Servers Available

When developing with Claude Code, these MCP servers are configured:

| Server | Use For |
|--------|---------|
| **postgres** | Query database directly, inspect data |
| **github** | Create issues/PRs, check CI status |
| **memory** | Store context across sessions |
| **context7** | Look up library documentation |

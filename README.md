# Job Tracker

A single-user application for ranking and tracking job openings using weighted scoring formulas.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Docker](https://www.docker.com/) for PostgreSQL

## Setup

1. Start the database:
   ```bash
   docker compose up -d
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run migrations:
   ```bash
   bun run db:migrate
   ```

4. Start the development server:
   ```bash
   bun run dev
   ```

5. Open http://localhost:5173

## Features

- Add and manage job openings with compensation, work location, and detailed descriptions
- Rate jobs across 13 criteria (impact, compensation, culture, growth, etc.)
- Mark standout opportunities with a "wow factor" flag
- Create custom scoring formulas with weighted criteria
- Rank and filter jobs by formula score, country, track, and wow status
- Track application status through 7 stages (not applied, applied, interviewing, offer, rejected, ghosted, dumped)
- Add notes to any job opening
- Track job posting sites and saved searches with "last checked" timestamps
- Track talent pools you've joined or submitted your profile to
- Paste HTML job descriptions — automatically converted to Markdown
- Back up and restore the database (`bun run db:backup` / `bun run db:restore`)

## Tech Stack

- Bun + TypeScript
- React Router v7
- PostgreSQL + Drizzle ORM
- shadcn/ui + Tailwind CSS

## Landing Page

See the project landing page at [danbim.github.io/application-tracker](https://danbim.github.io/application-tracker/).

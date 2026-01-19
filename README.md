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
   bunx drizzle-kit migrate
   ```

4. Start the development server:
   ```bash
   bun run dev
   ```

5. Open http://localhost:5173

## Features

- Add and manage job openings with detailed information
- Create custom scoring formulas with weighted criteria
- Rank jobs based on selected formula
- Track application status

## Tech Stack

- Bun + TypeScript
- React Router v7
- PostgreSQL + Drizzle ORM
- shadcn/ui + Tailwind CSS

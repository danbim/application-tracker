import { desc, eq, inArray, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import { type JobNote, jobNotes } from '~/db/schema'

export class JobNoteRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findByJobId(jobOpeningId: string): Promise<JobNote[]> {
    return this.db
      .select()
      .from(jobNotes)
      .where(eq(jobNotes.jobOpeningId, jobOpeningId))
      .orderBy(desc(jobNotes.createdAt))
  }

  async findById(id: string): Promise<JobNote | undefined> {
    const results = await this.db
      .select()
      .from(jobNotes)
      .where(eq(jobNotes.id, id))
    return results[0]
  }

  async create(data: {
    jobOpeningId: string
    content: string
  }): Promise<JobNote> {
    const results = await this.db.insert(jobNotes).values(data).returning()
    return results[0]
  }

  async update(
    id: string,
    data: { content: string },
  ): Promise<JobNote | undefined> {
    const results = await this.db
      .update(jobNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobNotes.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(jobNotes)
      .where(eq(jobNotes.id, id))
      .returning()
    return results.length > 0
  }

  async countByJobIds(jobOpeningIds: string[]): Promise<Map<string, number>> {
    if (jobOpeningIds.length === 0) {
      return new Map()
    }

    const results = await this.db
      .select({
        jobOpeningId: jobNotes.jobOpeningId,
        count: sql<number>`count(*)::int`,
      })
      .from(jobNotes)
      .where(inArray(jobNotes.jobOpeningId, jobOpeningIds))
      .groupBy(jobNotes.jobOpeningId)

    const counts = new Map<string, number>()
    for (const row of results) {
      counts.set(row.jobOpeningId, row.count)
    }
    return counts
  }
}

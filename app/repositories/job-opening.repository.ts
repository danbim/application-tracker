import { desc, eq, inArray, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import {
  type ApplicationStatus,
  type JobOpening,
  jobOpenings,
  type NewJobOpening,
} from '~/db/schema'

export class JobOpeningRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<JobOpening[]> {
    return this.db
      .select()
      .from(jobOpenings)
      .orderBy(desc(jobOpenings.dateAdded))
  }

  async findById(id: string): Promise<JobOpening | undefined> {
    const results = await this.db
      .select()
      .from(jobOpenings)
      .where(eq(jobOpenings.id, id))
    return results[0]
  }

  async create(data: NewJobOpening): Promise<JobOpening> {
    const results = await this.db.insert(jobOpenings).values(data).returning()
    return results[0]
  }

  async update(
    id: string,
    data: Partial<NewJobOpening>,
  ): Promise<JobOpening | undefined> {
    const results = await this.db
      .update(jobOpenings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobOpenings.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(jobOpenings)
      .where(eq(jobOpenings.id, id))
      .returning()
    return results.length > 0
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    date?: string | null,
  ): Promise<JobOpening | undefined> {
    const timestampField = this.getTimestampFieldForStatus(status)
    const timestamp = date ? new Date(date) : new Date()

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    if (timestampField) {
      updateData[timestampField] = timestamp
    }

    const results = await this.db
      .update(jobOpenings)
      .set(updateData)
      .where(eq(jobOpenings.id, id))
      .returning()
    return results[0]
  }

  private getTimestampFieldForStatus(status: ApplicationStatus): string | null {
    const mapping: Record<ApplicationStatus, string | null> = {
      not_applied: null,
      applied: 'appliedAt',
      interviewing: 'interviewingAt',
      offer: 'offerAt',
      rejected: 'rejectedAt',
      ghosted: 'ghostedAt',
      dumped: 'dumpedAt',
    }
    return mapping[status]
  }

  async countByStatus(): Promise<Record<ApplicationStatus, number>> {
    const results = await this.db
      .select({
        status: jobOpenings.status,
        count: sql<number>`count(*)::int`,
      })
      .from(jobOpenings)
      .groupBy(jobOpenings.status)

    const counts: Record<ApplicationStatus, number> = {
      not_applied: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
      ghosted: 0,
      dumped: 0,
    }

    for (const row of results) {
      counts[row.status] = row.count
    }

    return counts
  }

  async findByStatuses(statuses: ApplicationStatus[]): Promise<JobOpening[]> {
    return this.db
      .select()
      .from(jobOpenings)
      .where(inArray(jobOpenings.status, statuses))
      .orderBy(desc(jobOpenings.dateAdded))
  }
}

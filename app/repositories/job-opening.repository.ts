import { desc, eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import { type JobOpening, jobOpenings, type NewJobOpening } from '~/db/schema'

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

  async updateApplicationStatus(
    id: string,
    sent: boolean,
    sentDate: string | null,
  ): Promise<JobOpening | undefined> {
    const results = await this.db
      .update(jobOpenings)
      .set({
        applicationSent: sent,
        applicationSentDate: sentDate,
        updatedAt: new Date(),
      })
      .where(eq(jobOpenings.id, id))
      .returning()
    return results[0]
  }
}

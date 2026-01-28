import { eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import {
  type JobPostingSite,
  jobPostingSites,
  type NewJobPostingSite,
} from '~/db/schema'

export class JobPostingSiteRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<JobPostingSite[]> {
    return this.db
      .select()
      .from(jobPostingSites)
      .orderBy(sql`${jobPostingSites.lastCheckedAt} ASC NULLS FIRST`)
  }

  async findById(id: string): Promise<JobPostingSite | undefined> {
    const results = await this.db
      .select()
      .from(jobPostingSites)
      .where(eq(jobPostingSites.id, id))
    return results[0]
  }

  async create(data: NewJobPostingSite): Promise<JobPostingSite> {
    const results = await this.db
      .insert(jobPostingSites)
      .values(data)
      .returning()
    return results[0]
  }

  async update(
    id: string,
    data: Partial<NewJobPostingSite>,
  ): Promise<JobPostingSite | undefined> {
    const results = await this.db
      .update(jobPostingSites)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobPostingSites.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(jobPostingSites)
      .where(eq(jobPostingSites.id, id))
      .returning()
    return results.length > 0
  }

  async markChecked(id: string): Promise<JobPostingSite | undefined> {
    const now = new Date()
    const results = await this.db
      .update(jobPostingSites)
      .set({ lastCheckedAt: now, updatedAt: now })
      .where(eq(jobPostingSites.id, id))
      .returning()
    return results[0]
  }
}

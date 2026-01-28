import { eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import { type NewTalentPool, type TalentPool, talentPools } from '~/db/schema'

export class TalentPoolRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<TalentPool[]> {
    return this.db
      .select()
      .from(talentPools)
      .orderBy(
        sql`${talentPools.status} ASC`,
        sql`${talentPools.companyName} ASC`,
      )
  }

  async findById(id: string): Promise<TalentPool | undefined> {
    const results = await this.db
      .select()
      .from(talentPools)
      .where(eq(talentPools.id, id))
    return results[0]
  }

  async create(data: NewTalentPool): Promise<TalentPool> {
    const results = await this.db.insert(talentPools).values(data).returning()
    return results[0]
  }

  async update(
    id: string,
    data: Partial<NewTalentPool>,
  ): Promise<TalentPool | undefined> {
    const results = await this.db
      .update(talentPools)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(talentPools.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(talentPools)
      .where(eq(talentPools.id, id))
      .returning()
    return results.length > 0
  }

  async toggleStatus(id: string): Promise<TalentPool | undefined> {
    const pool = await this.findById(id)
    if (!pool) return undefined
    const newStatus =
      pool.status === 'submitted' ? 'not_submitted' : 'submitted'
    const now = new Date()
    const results = await this.db
      .update(talentPools)
      .set({ status: newStatus, updatedAt: now })
      .where(eq(talentPools.id, id))
      .returning()
    return results[0]
  }
}

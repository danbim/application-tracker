import { eq } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import {
  type NewScoringFormula,
  type ScoringFormula,
  scoringFormulas,
} from '~/db/schema'

export class ScoringFormulaRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async findAll(): Promise<ScoringFormula[]> {
    return this.db.select().from(scoringFormulas).orderBy(scoringFormulas.name)
  }

  async findById(id: string): Promise<ScoringFormula | undefined> {
    const results = await this.db
      .select()
      .from(scoringFormulas)
      .where(eq(scoringFormulas.id, id))
    return results[0]
  }

  async create(data: NewScoringFormula): Promise<ScoringFormula> {
    const results = await this.db
      .insert(scoringFormulas)
      .values(data)
      .returning()
    return results[0]
  }

  async update(
    id: string,
    data: Partial<NewScoringFormula>,
  ): Promise<ScoringFormula | undefined> {
    const results = await this.db
      .update(scoringFormulas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(scoringFormulas.id, id))
      .returning()
    return results[0]
  }

  async delete(id: string): Promise<boolean> {
    const results = await this.db
      .delete(scoringFormulas)
      .where(eq(scoringFormulas.id, id))
      .returning()
    return results.length > 0
  }
}

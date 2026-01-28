import type { NewTalentPool, TalentPool } from '~/db/schema'
import type { TalentPoolRepository } from '~/repositories/talent-pool.repository'

export class TalentPoolService {
  constructor(private repository: TalentPoolRepository) {}

  async findAll(): Promise<TalentPool[]> {
    return this.repository.findAll()
  }

  async findById(id: string): Promise<TalentPool | undefined> {
    return this.repository.findById(id)
  }

  async create(data: NewTalentPool): Promise<TalentPool> {
    return this.repository.create(data)
  }

  async update(
    id: string,
    data: Partial<NewTalentPool>,
  ): Promise<TalentPool | undefined> {
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id)
  }

  async toggleStatus(id: string): Promise<TalentPool | undefined> {
    return this.repository.toggleStatus(id)
  }
}

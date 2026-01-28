import type { JobPostingSite, NewJobPostingSite } from '~/db/schema'
import type { JobPostingSiteRepository } from '~/repositories/job-posting-site.repository'

export class JobPostingSiteService {
  constructor(private repository: JobPostingSiteRepository) {}

  async findAll(): Promise<JobPostingSite[]> {
    return this.repository.findAll()
  }

  async findById(id: string): Promise<JobPostingSite | undefined> {
    return this.repository.findById(id)
  }

  async create(data: NewJobPostingSite): Promise<JobPostingSite> {
    return this.repository.create(data)
  }

  async update(
    id: string,
    data: Partial<NewJobPostingSite>,
  ): Promise<JobPostingSite | undefined> {
    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id)
  }

  async markChecked(id: string): Promise<JobPostingSite | undefined> {
    return this.repository.markChecked(id)
  }
}

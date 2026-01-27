import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '~/db/schema'
import { jobOpenings, type NewJobOpening } from '~/db/schema'
import { JobOpeningRepository } from './job-opening.repository'

describe('JobOpeningRepository', () => {
  let pglite: PGlite
  let db: ReturnType<typeof drizzle<typeof schema>>
  let repository: JobOpeningRepository

  const createTestJob = (
    overrides: Partial<NewJobOpening> = {},
  ): NewJobOpening => ({
    title: 'Test Engineer',
    company: 'Test Corp',
    description: 'A test job opening',
    ...overrides,
  })

  beforeAll(async () => {
    pglite = new PGlite()
    db = drizzle(pglite, { schema })
    await migrate(db, { migrationsFolder: './app/db/migrations' })
    repository = new JobOpeningRepository(db)
  })

  afterAll(async () => {
    await pglite.close()
  })

  beforeEach(async () => {
    await db.delete(jobOpenings)
  })

  describe('create', () => {
    it('should create a job opening and return it with generated id', async () => {
      const data = createTestJob({ title: 'Senior Engineer' })

      const result = await repository.create(data)

      expect(result.id).toBeDefined()
      expect(result.title).toBe('Senior Engineer')
      expect(result.company).toBe('Test Corp')
      expect(result.status).toBe('not_applied')
    })

    it('should set default values for optional fields', async () => {
      const data = createTestJob()

      const result = await repository.create(data)

      expect(result.wow).toBe(false)
      expect(result.status).toBe('not_applied')
      expect(result.dateAdded).toBeInstanceOf(Date)
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('findById', () => {
    it('should return the job when it exists', async () => {
      const created = await repository.create(
        createTestJob({ title: 'Find Me' }),
      )

      const result = await repository.findById(created.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(created.id)
      expect(result?.title).toBe('Find Me')
    })

    it('should return undefined when job does not exist', async () => {
      const result = await repository.findById(
        '00000000-0000-0000-0000-000000000000',
      )

      expect(result).toBeUndefined()
    })
  })

  describe('findAll', () => {
    it('should return all jobs ordered by dateAdded descending', async () => {
      const job1 = await repository.create(createTestJob({ title: 'First' }))
      await new Promise((resolve) => setTimeout(resolve, 10))
      const job2 = await repository.create(createTestJob({ title: 'Second' }))
      await new Promise((resolve) => setTimeout(resolve, 10))
      const job3 = await repository.create(createTestJob({ title: 'Third' }))

      const results = await repository.findAll()

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe(job3.id)
      expect(results[1].id).toBe(job2.id)
      expect(results[2].id).toBe(job1.id)
    })

    it('should return empty array when no jobs exist', async () => {
      const results = await repository.findAll()

      expect(results).toEqual([])
    })
  })

  describe('update', () => {
    it('should update specified fields and return updated job', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.update(created.id, {
        title: 'Updated Title',
        company: 'New Company',
      })

      expect(result).toBeDefined()
      expect(result?.title).toBe('Updated Title')
      expect(result?.company).toBe('New Company')
      expect(result?.description).toBe(created.description)
    })

    it('should update the updatedAt timestamp', async () => {
      const created = await repository.create(createTestJob())
      const originalUpdatedAt = created.updatedAt

      await new Promise((resolve) => setTimeout(resolve, 10))
      const result = await repository.update(created.id, { title: 'New Title' })

      expect(result?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      )
    })

    it('should return undefined when job does not exist', async () => {
      const result = await repository.update(
        '00000000-0000-0000-0000-000000000000',
        {
          title: 'New Title',
        },
      )

      expect(result).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete the job and return true', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.delete(created.id)

      expect(result).toBe(true)

      const found = await repository.findById(created.id)
      expect(found).toBeUndefined()
    })

    it('should return false when job does not exist', async () => {
      const result = await repository.delete(
        '00000000-0000-0000-0000-000000000000',
      )

      expect(result).toBe(false)
    })
  })

  describe('updateStatus', () => {
    it('should update status to applied and set appliedAt', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.updateStatus(created.id, 'applied')

      expect(result?.status).toBe('applied')
      expect(result?.appliedAt).toBeInstanceOf(Date)
    })

    it('should update status to interviewing and set interviewingAt', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.updateStatus(created.id, 'interviewing')

      expect(result?.status).toBe('interviewing')
      expect(result?.interviewingAt).toBeInstanceOf(Date)
    })

    it('should update status to offer and set offerAt', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.updateStatus(created.id, 'offer')

      expect(result?.status).toBe('offer')
      expect(result?.offerAt).toBeInstanceOf(Date)
    })

    it('should update status to rejected and set rejectedAt', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.updateStatus(created.id, 'rejected')

      expect(result?.status).toBe('rejected')
      expect(result?.rejectedAt).toBeInstanceOf(Date)
    })

    it('should update status to ghosted and set ghostedAt', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.updateStatus(created.id, 'ghosted')

      expect(result?.status).toBe('ghosted')
      expect(result?.ghostedAt).toBeInstanceOf(Date)
    })

    it('should update status to dumped and set dumpedAt', async () => {
      const created = await repository.create(createTestJob())

      const result = await repository.updateStatus(created.id, 'dumped')

      expect(result?.status).toBe('dumped')
      expect(result?.dumpedAt).toBeInstanceOf(Date)
    })

    it('should update status to not_applied without setting any timestamp', async () => {
      const created = await repository.create(
        createTestJob({ status: 'applied' }),
      )

      const result = await repository.updateStatus(created.id, 'not_applied')

      expect(result?.status).toBe('not_applied')
    })

    it('should use provided date when specified', async () => {
      const created = await repository.create(createTestJob())
      const customDate = '2026-01-15'

      const result = await repository.updateStatus(
        created.id,
        'applied',
        customDate,
      )

      expect(result?.appliedAt).toEqual(new Date(customDate))
    })

    it('should return undefined when job does not exist', async () => {
      const result = await repository.updateStatus(
        '00000000-0000-0000-0000-000000000000',
        'applied',
      )

      expect(result).toBeUndefined()
    })
  })

  describe('countByStatus', () => {
    it('should return counts for all statuses', async () => {
      await repository.create(createTestJob({ status: 'not_applied' }))
      await repository.create(createTestJob({ status: 'not_applied' }))
      await repository.create(createTestJob({ status: 'applied' }))
      await repository.create(createTestJob({ status: 'interviewing' }))
      await repository.create(createTestJob({ status: 'offer' }))
      await repository.create(createTestJob({ status: 'rejected' }))
      await repository.create(createTestJob({ status: 'ghosted' }))
      await repository.create(createTestJob({ status: 'dumped' }))

      const counts = await repository.countByStatus()

      expect(counts.not_applied).toBe(2)
      expect(counts.applied).toBe(1)
      expect(counts.interviewing).toBe(1)
      expect(counts.offer).toBe(1)
      expect(counts.rejected).toBe(1)
      expect(counts.ghosted).toBe(1)
      expect(counts.dumped).toBe(1)
    })

    it('should return zeros for all statuses when no jobs exist', async () => {
      const counts = await repository.countByStatus()

      expect(counts.not_applied).toBe(0)
      expect(counts.applied).toBe(0)
      expect(counts.interviewing).toBe(0)
      expect(counts.offer).toBe(0)
      expect(counts.rejected).toBe(0)
      expect(counts.ghosted).toBe(0)
      expect(counts.dumped).toBe(0)
    })
  })

  describe('findByStatuses', () => {
    it('should return jobs with matching statuses', async () => {
      await repository.create(
        createTestJob({ title: 'Job 1', status: 'not_applied' }),
      )
      await repository.create(
        createTestJob({ title: 'Job 2', status: 'applied' }),
      )
      await repository.create(
        createTestJob({ title: 'Job 3', status: 'interviewing' }),
      )
      await repository.create(
        createTestJob({ title: 'Job 4', status: 'rejected' }),
      )

      const results = await repository.findByStatuses([
        'applied',
        'interviewing',
      ])

      expect(results).toHaveLength(2)
      expect(results.map((j) => j.title).sort()).toEqual(['Job 2', 'Job 3'])
    })

    it('should return empty array when no jobs match', async () => {
      await repository.create(createTestJob({ status: 'not_applied' }))

      const results = await repository.findByStatuses(['offer', 'rejected'])

      expect(results).toEqual([])
    })

    it('should order results by dateAdded descending', async () => {
      const job1 = await repository.create(
        createTestJob({ title: 'First', status: 'applied' }),
      )
      await new Promise((resolve) => setTimeout(resolve, 10))
      const job2 = await repository.create(
        createTestJob({ title: 'Second', status: 'applied' }),
      )

      const results = await repository.findByStatuses(['applied'])

      expect(results[0].id).toBe(job2.id)
      expect(results[1].id).toBe(job1.id)
    })
  })
})

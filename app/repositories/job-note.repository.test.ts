import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from '~/db/schema'
import { jobNotes, jobOpenings, type NewJobOpening } from '~/db/schema'
import { JobNoteRepository } from './job-note.repository'

describe('JobNoteRepository', () => {
  let pglite: PGlite
  let db: ReturnType<typeof drizzle<typeof schema>>
  let repository: JobNoteRepository
  let testJobId: string

  const createTestJob = async (
    overrides: Partial<NewJobOpening> = {},
  ): Promise<string> => {
    const results = await db
      .insert(jobOpenings)
      .values({
        title: 'Test Engineer',
        company: 'Test Corp',
        description: 'A test job opening',
        ...overrides,
      })
      .returning()
    return results[0].id
  }

  beforeAll(async () => {
    pglite = new PGlite()
    db = drizzle(pglite, { schema })
    await migrate(db, { migrationsFolder: './app/db/migrations' })
    repository = new JobNoteRepository(db)
  })

  afterAll(async () => {
    await pglite.close()
  })

  beforeEach(async () => {
    await db.delete(jobNotes)
    await db.delete(jobOpenings)
    testJobId = await createTestJob()
  })

  describe('create', () => {
    it('should create a note and return it with generated id', async () => {
      const result = await repository.create({
        jobOpeningId: testJobId,
        content: 'This is a test note',
      })

      expect(result.id).toBeDefined()
      expect(result.jobOpeningId).toBe(testJobId)
      expect(result.content).toBe('This is a test note')
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
    })

    it('should create multiple notes for the same job', async () => {
      await repository.create({ jobOpeningId: testJobId, content: 'First note' })
      await repository.create({ jobOpeningId: testJobId, content: 'Second note' })
      await repository.create({ jobOpeningId: testJobId, content: 'Third note' })

      const notes = await repository.findByJobId(testJobId)
      expect(notes).toHaveLength(3)
    })
  })

  describe('findById', () => {
    it('should return the note when it exists', async () => {
      const created = await repository.create({
        jobOpeningId: testJobId,
        content: 'Find me',
      })

      const result = await repository.findById(created.id)

      expect(result).toBeDefined()
      expect(result?.id).toBe(created.id)
      expect(result?.content).toBe('Find me')
    })

    it('should return undefined when note does not exist', async () => {
      const result = await repository.findById('00000000-0000-0000-0000-000000000000')

      expect(result).toBeUndefined()
    })
  })

  describe('findByJobId', () => {
    it('should return notes ordered by createdAt descending', async () => {
      const note1 = await repository.create({
        jobOpeningId: testJobId,
        content: 'First note',
      })
      await new Promise((resolve) => setTimeout(resolve, 10))
      const note2 = await repository.create({
        jobOpeningId: testJobId,
        content: 'Second note',
      })
      await new Promise((resolve) => setTimeout(resolve, 10))
      const note3 = await repository.create({
        jobOpeningId: testJobId,
        content: 'Third note',
      })

      const results = await repository.findByJobId(testJobId)

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe(note3.id)
      expect(results[1].id).toBe(note2.id)
      expect(results[2].id).toBe(note1.id)
    })

    it('should return empty array when job has no notes', async () => {
      const results = await repository.findByJobId(testJobId)

      expect(results).toEqual([])
    })

    it('should only return notes for the specified job', async () => {
      const job2Id = await createTestJob({ title: 'Another Job' })

      await repository.create({ jobOpeningId: testJobId, content: 'Note for job 1' })
      await repository.create({ jobOpeningId: job2Id, content: 'Note for job 2' })

      const resultsJob1 = await repository.findByJobId(testJobId)
      const resultsJob2 = await repository.findByJobId(job2Id)

      expect(resultsJob1).toHaveLength(1)
      expect(resultsJob1[0].content).toBe('Note for job 1')
      expect(resultsJob2).toHaveLength(1)
      expect(resultsJob2[0].content).toBe('Note for job 2')
    })
  })

  describe('update', () => {
    it('should update the content and return updated note', async () => {
      const created = await repository.create({
        jobOpeningId: testJobId,
        content: 'Original content',
      })

      const result = await repository.update(created.id, {
        content: 'Updated content',
      })

      expect(result).toBeDefined()
      expect(result?.content).toBe('Updated content')
      expect(result?.jobOpeningId).toBe(testJobId)
    })

    it('should update the updatedAt timestamp', async () => {
      const created = await repository.create({
        jobOpeningId: testJobId,
        content: 'Original content',
      })
      const originalUpdatedAt = created.updatedAt

      await new Promise((resolve) => setTimeout(resolve, 10))
      const result = await repository.update(created.id, {
        content: 'New content',
      })

      expect(result?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
    })

    it('should return undefined when note does not exist', async () => {
      const result = await repository.update('00000000-0000-0000-0000-000000000000', {
        content: 'New content',
      })

      expect(result).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('should delete the note and return true', async () => {
      const created = await repository.create({
        jobOpeningId: testJobId,
        content: 'Delete me',
      })

      const result = await repository.delete(created.id)

      expect(result).toBe(true)

      const found = await repository.findById(created.id)
      expect(found).toBeUndefined()
    })

    it('should return false when note does not exist', async () => {
      const result = await repository.delete('00000000-0000-0000-0000-000000000000')

      expect(result).toBe(false)
    })
  })

  describe('countByJobIds', () => {
    it('should return counts for jobs with notes', async () => {
      const job2Id = await createTestJob({ title: 'Job 2' })
      const job3Id = await createTestJob({ title: 'Job 3' })

      await repository.create({ jobOpeningId: testJobId, content: 'Note 1 for job 1' })
      await repository.create({ jobOpeningId: testJobId, content: 'Note 2 for job 1' })
      await repository.create({ jobOpeningId: testJobId, content: 'Note 3 for job 1' })
      await repository.create({ jobOpeningId: job2Id, content: 'Note 1 for job 2' })
      // job3 has no notes

      const counts = await repository.countByJobIds([testJobId, job2Id, job3Id])

      expect(counts.get(testJobId)).toBe(3)
      expect(counts.get(job2Id)).toBe(1)
      expect(counts.get(job3Id)).toBeUndefined() // jobs with 0 notes won't be in map
    })

    it('should return empty map when no job IDs provided', async () => {
      const counts = await repository.countByJobIds([])

      expect(counts.size).toBe(0)
    })

    it('should return empty map when jobs have no notes', async () => {
      const job2Id = await createTestJob({ title: 'Job 2' })

      const counts = await repository.countByJobIds([testJobId, job2Id])

      expect(counts.size).toBe(0)
    })
  })
})

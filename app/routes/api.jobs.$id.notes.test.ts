import { beforeEach, describe, expect, it, vi } from 'vitest'
import { action, loader } from './api.jobs.$id.notes'

vi.mock('~/services/index.server', () => ({
  jobNoteRepository: {
    findByJobId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { jobNoteRepository } from '~/services/index.server'

const mockNoteRepo = vi.mocked(jobNoteRepository)

function createFormDataRequest(data: Record<string, string>): Request {
  const formData = new FormData()
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value)
  }
  return new Request('http://localhost/api/jobs/job-123/notes', {
    method: 'POST',
    body: formData,
  })
}

describe('api.jobs.$id.notes resource route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loader', () => {
    it('returns notes for the given job id', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          jobOpeningId: 'job-123',
          content: 'First note',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      mockNoteRepo.findByJobId.mockResolvedValue(mockNotes)

      const result = await loader({
        request: new Request('http://localhost/api/jobs/job-123/notes'),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockNoteRepo.findByJobId).toHaveBeenCalledWith('job-123')
      expect(result.notes).toEqual(mockNotes)
    })

    it('throws 400 when no id provided', async () => {
      await expect(
        loader({
          request: new Request('http://localhost/api/jobs//notes'),
          params: {},
          context: {},
        }),
      ).rejects.toThrow()

      try {
        await loader({
          request: new Request('http://localhost/api/jobs//notes'),
          params: {},
          context: {},
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Response)
        expect((error as Response).status).toBe(400)
      }
    })
  })

  describe('action', () => {
    it('creates a note with createNote intent', async () => {
      mockNoteRepo.create.mockResolvedValue({
        id: 'note-new',
        jobOpeningId: 'job-123',
        content: 'New note',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await action({
        request: createFormDataRequest({
          intent: 'createNote',
          content: 'New note',
        }),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockNoteRepo.create).toHaveBeenCalledWith({
        jobOpeningId: 'job-123',
        content: 'New note',
      })
      expect(result).toEqual({ success: true })
    })

    it('updates a note with updateNote intent', async () => {
      mockNoteRepo.update.mockResolvedValue({
        id: 'note-1',
        jobOpeningId: 'job-123',
        content: 'Updated content',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await action({
        request: createFormDataRequest({
          intent: 'updateNote',
          noteId: 'note-1',
          content: 'Updated content',
        }),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockNoteRepo.update).toHaveBeenCalledWith('note-1', {
        content: 'Updated content',
      })
      expect(result).toEqual({ success: true })
    })

    it('deletes a note with deleteNote intent', async () => {
      mockNoteRepo.delete.mockResolvedValue(true)

      const result = await action({
        request: createFormDataRequest({
          intent: 'deleteNote',
          noteId: 'note-1',
        }),
        params: { id: 'job-123' },
        context: {},
      })

      expect(mockNoteRepo.delete).toHaveBeenCalledWith('note-1')
      expect(result).toEqual({ success: true })
    })

    it('returns success false for unknown intent', async () => {
      const result = await action({
        request: createFormDataRequest({
          intent: 'unknownIntent',
        }),
        params: { id: 'job-123' },
        context: {},
      })

      expect(result).toEqual({ success: false })
    })

    it('throws 400 when no id provided', async () => {
      await expect(
        action({
          request: createFormDataRequest({
            intent: 'createNote',
            content: 'test',
          }),
          params: {},
          context: {},
        }),
      ).rejects.toThrow()

      try {
        await action({
          request: createFormDataRequest({
            intent: 'createNote',
            content: 'test',
          }),
          params: {},
          context: {},
        })
      } catch (error) {
        expect(error).toBeInstanceOf(Response)
        expect((error as Response).status).toBe(400)
      }
    })
  })
})

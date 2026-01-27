import { jobNoteRepository } from '~/services/index.server'
import type { Route } from './+types/api.jobs.$id.notes'

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params
  if (!id) {
    throw new Response('Bad Request', { status: 400 })
  }

  const notes = await jobNoteRepository.findByJobId(id)
  return { notes }
}

export async function action({ request, params }: Route.ActionArgs) {
  const { id } = params
  if (!id) {
    throw new Response('Bad Request', { status: 400 })
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'createNote') {
    const content = formData.get('content') as string
    await jobNoteRepository.create({ jobOpeningId: id, content })
    return { success: true }
  }

  if (intent === 'updateNote') {
    const noteId = formData.get('noteId') as string
    const content = formData.get('content') as string
    await jobNoteRepository.update(noteId, { content })
    return { success: true }
  }

  if (intent === 'deleteNote') {
    const noteId = formData.get('noteId') as string
    await jobNoteRepository.delete(noteId)
    return { success: true }
  }

  return { success: false }
}

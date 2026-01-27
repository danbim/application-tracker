import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import type { JobNote } from '~/db/schema'
import { formatDualTimestamp } from '~/lib/format-timestamp'

type NotesPanelProps = {
  jobId: string
  jobTitle: string
  jobCompany: string
  isOpen: boolean
  onClose: () => void
}

export function NotesPanel({
  jobId,
  jobTitle,
  jobCompany,
  isOpen,
  onClose,
}: NotesPanelProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const fetcher = useFetcher()
  const loadFetcher = useFetcher<{ notes: JobNote[] }>()
  const formRef = useRef<HTMLFormElement>(null)
  const prevFetcherState = useRef(fetcher.state)

  const notes = loadFetcher.data?.notes ?? []
  const resourceUrl = `/api/jobs/${jobId}/notes`

  // Load notes when panel opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadFetcher.load is stable but causes re-render loops if listed
  useEffect(() => {
    if (isOpen) {
      loadFetcher.load(resourceUrl)
    }
  }, [isOpen, resourceUrl])

  // Reset form after successful submission and refetch notes
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadFetcher.load is stable but causes re-render loops if listed
  useEffect(() => {
    if (prevFetcherState.current !== 'idle' && fetcher.state === 'idle') {
      if (formRef.current) {
        formRef.current.reset()
      }
      setEditingNoteId(null)
      loadFetcher.load(resourceUrl)
    }
    prevFetcherState.current = fetcher.state
  }, [fetcher.state, resourceUrl])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingNoteId) {
          setEditingNoteId(null)
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, editingNoteId])

  if (!isOpen) return null

  const startEditing = (note: JobNote) => {
    setEditingNoteId(note.id)
    setEditContent(note.content)
  }

  const cancelEditing = () => {
    setEditingNoteId(null)
    setEditContent('')
  }

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: Backdrop is purely decorative, Escape key handled by document listener */}
      <div
        data-testid="notes-panel-backdrop"
        className="fixed inset-0 bg-black/20 z-40 cursor-default"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-labelledby="notes-panel-title"
        aria-modal="true"
        className="fixed top-0 right-0 h-full w-[400px] bg-background border-l shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-start">
          <div>
            <h2 id="notes-panel-title" className="font-semibold text-lg">
              {jobTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{jobCompany}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close notes panel"
          >
            ✕
          </Button>
        </div>

        {/* Add Note Form */}
        <div className="p-4 border-b">
          <fetcher.Form method="post" ref={formRef} action={resourceUrl}>
            <input type="hidden" name="intent" value="createNote" />
            <input type="hidden" name="jobId" value={jobId} />
            <Textarea
              name="content"
              placeholder="Add a note..."
              className="mb-2 min-h-[80px]"
              required
            />
            <Button type="submit" size="sm" disabled={fetcher.state !== 'idle'}>
              {fetcher.state !== 'idle' ? 'Adding...' : 'Add Note'}
            </Button>
          </fetcher.Form>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet. Add one above.
            </p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3 space-y-2">
                {editingNoteId === note.id ? (
                  <fetcher.Form method="post" action={resourceUrl}>
                    <input type="hidden" name="intent" value="updateNote" />
                    <input type="hidden" name="noteId" value={note.id} />
                    <Textarea
                      name="content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mb-2 min-h-[80px]"
                      required
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={fetcher.state !== 'idle'}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </fetcher.Form>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none">
                      <Markdown>{note.content}</Markdown>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {formatDualTimestamp(note.createdAt)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(note)}
                        >
                          Edit
                        </Button>
                        <fetcher.Form method="post" action={resourceUrl}>
                          <input
                            type="hidden"
                            name="intent"
                            value="deleteNote"
                          />
                          <input type="hidden" name="noteId" value={note.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </fetcher.Form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

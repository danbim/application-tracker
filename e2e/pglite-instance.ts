import type { PGlite } from '@electric-sql/pglite'

let pgliteInstance: PGlite | null = null

export function setPgliteInstance(instance: PGlite) {
  pgliteInstance = instance
}

export function getPgliteInstance(): PGlite {
  if (!pgliteInstance) {
    throw new Error('PGLite instance not initialized. Call setPgliteInstance first.')
  }
  return pgliteInstance
}

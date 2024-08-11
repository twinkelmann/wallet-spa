export type ID = PouchDB.Core.DocumentId

export interface HasTimestamps {
  /**
   * Unix EPOCH
   */
  createdAt: number
  /**
   * Unix EPOCH
   */
  updatedAt: number
}

export type RelDocument<Content extends {}> = Content & {
  id: ID
  rev: string
}

// Copy of the Builtin Record type, since the name clashes with our Record interface
export type ById<T> = { [P in ID]: T }

export const UPDATE_DATA_DEBOUNCE = 20

export type ID = PouchDB.Core.DocumentId

export interface HasTimestamps {
  /**
   * ISO DateTime String
   */
  createdAt: Date
  /**
   * ISO DateTime String
   */
  updatedAt: Date
}

export type RelDocument<Content extends {}> = Content & {
  id: ID
  rev: string
}

export function deleteById(array: PouchDB.Core.IdMeta[], id: ID) {
  array.splice(
    array.findIndex((w) => w._id === id),
    1
  )
}

/**
 * In case better UTF16/Locales support is needed, see https://stackoverflow.com/a/53930826
 */
export function capitalizeFirstLetter(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

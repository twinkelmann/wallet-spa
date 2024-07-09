export type UUID = `${string}-${string}-${string}-${string}-${string}`

export interface HasId {
  /**
   * Random UUID
   */
  id: UUID
}

export interface HasTimestamps {
  /**
   * ISO DateTime String
   */
  createdAt: string
  /**
   * ISO DateTime String
   */
  updatedAt: string
}

export function deleteById(array: HasId[], id: UUID) {
  array.splice(
    array.findIndex((w) => w.id === id),
    1
  )
}

/**
 * In case better UTF16/Locales support is needed, see https://stackoverflow.com/a/53930826
 */
export function capitalizeFirstLetter(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

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

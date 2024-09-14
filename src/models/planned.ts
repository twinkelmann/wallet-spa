import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'

export interface PlannedEntry {
  approved: boolean
  dismissed: boolean
  /**
   * Unix EPOCH
   */
  plannedDate: number
}

export interface Planned extends HasTimestamps {
  accountId: ID
  categoryId: ID
  labelIds: ID[]
  name: string
  value: number
  payee: string | null
  description: string | null
  /**
   * Unix EPOCH
   */
  startDate: number
  /**
   * If null, one time payment
   */
  recurrenceRule: string | null
  entries: PlannedEntry[]
}

export function createPlanned(
  accountId: ID,
  categoryId: ID,
  labelIds: ID[],
  name: string,
  value: number,
  payee: string | null,
  description: string | null,
  startDate: number,
  recurrenceRule: string | null,
  entries: PlannedEntry[] = []
): Promise<ID> {
  return DB.then((db) => {
    const now = new Date().valueOf()
    const newPlanned = {
      accountId,
      categoryId,
      labelIds,
      name,
      value,
      payee,
      description,
      startDate,
      recurrenceRule,
      entries,
      createdAt: now,
      updatedAt: now,
    } as Planned
    return db.rel.save('planned', newPlanned)
  }).then((res) => res.id)
}

export function getPlanned(id: ID): Promise<RelDocument<Planned> | undefined> {
  return DB.then((db) => db.rel.find('planned', id)).then(
    (res) => res.planneds[0]
  )
}

export function getAllPlannedsOfAccount(
  id: ID
): Promise<RelDocument<Planned>[]> {
  return DB.then((db) => db.rel.findHasMany('planned', 'accountId', id)).then(
    (res) => res.planneds
  )
}

export function getAllPlannedsOfAccounts(
  ids: ID[],
  limit: number | null = null
): Promise<RelDocument<Planned>[]> {
  return DB.then((db) => {
    return db
      .find({
        selector: {
          $and: [
            {
              'data.accountId': {
                $in: ids,
              },
            },
            {
              _id: {
                $gt: db.rel.makeDocID({ type: 'planned' }),
                $lt: db.rel.makeDocID({ type: 'planned', id: {} }),
              },
            },
          ],
        },
        limit: limit ? limit : 2 ** 32 - 1,
      })
      .then((data) => {
        return db.rel.parseRelDocs('planned', data.docs)
      })
      .then((res) => res.planneds)
  })
}

export function updatePlanned(
  id: ID,
  accountId: ID,
  categoryId: ID,
  labelIds: ID[],
  name: string,
  value: number,
  payee: string | null,
  description: string | null,
  startDate: number,
  recurrenceRule: string | null,
  entries: PlannedEntry[]
): Promise<ID> {
  return DB.then((db) =>
    db.rel.find('planned', id).then((res) => {
      const data = res.planneds[0] as RelDocument<Planned>
      if (!id || !data) {
        throw `Could not find planned with id=${id}`
      }

      const now = new Date().valueOf()
      data.accountId = accountId
      data.categoryId = categoryId
      data.labelIds = labelIds
      data.name = name
      data.value = value
      data.payee = payee
      data.description = description
      data.startDate = startDate
      data.recurrenceRule = recurrenceRule
      data.entries = entries
      data.updatedAt = now

      return db.rel.save('planned', data)
    })
  ).then((res) => res.id)
}

// TODO: can you really delete a planned ? maybe it doesn't make sense
export function deletePlanned(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('planned', id).then((res) => {
      const data = res.planneds[0] as RelDocument<Planned>
      if (!id || !data) {
        throw `Could not find planned with id=${id}`
      }
      // TODO: delete reference from records
      return db.rel.del('planned', data)
    })
  )
}

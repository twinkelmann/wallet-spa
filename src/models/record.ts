import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'

export interface Record extends HasTimestamps {
  account: ID
  category: ID
  value: number
  payee: string | null
  description: string | null
  datetime: Date
}

export function createRecord(
  account: ID,
  value: number,
  payee: string | null,
  description: string | null,
  datetime: Date
): Promise<ID> {
  return DB.then((db) => {
    const now = new Date()
    const newRecord = {
      account,
      value,
      payee,
      description,
      datetime,
      createdAt: now,
      updatedAt: new Date(now),
    } as Record
    return db.rel.save('record', newRecord)
    // TODO: recompute account balance & monthlies
  }).then((res) => res.id)
}

export function getRecord(id: ID): Promise<RelDocument<Record>> {
  return DB.then((db) => db.rel.find('record', id)).then(
    (res) => res.records[0]
  )
}

export function getAllRecords(): Promise<RelDocument<Record>[]> {
  return DB.then((db) => db.rel.find('record')).then((res) => res.records)
}

export function updateRecord(
  id: ID,
  account: ID,
  value: number,
  payee: string | null,
  description: string | null,
  datetime: Date
): Promise<void> {
  return DB.then((db) =>
    db.rel.find('record', id).then((res) => {
      const data = res.records[0] as RelDocument<Record>
      if (!data) {
        throw `Could not find record with id=${id}`
      }

      const now = new Date()
      data.account = account
      data.value = value
      data.payee = payee
      data.description = description
      data.datetime = datetime
      data.updatedAt = now

      return db.rel.save('record', data)
      // TODO: recompute account balance & monthlies
    })
  ).then((res) => res.id)
}

export function deleteRecord(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('record', id).then((res) => {
      const data = res.records[0] as RelDocument<Record>
      if (!data) {
        throw `Could not find record with id=${id}`
      }
      return db.rel.del('record', data)
    })
  )
}

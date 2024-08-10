import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'
import { updateBalance } from '@/util'

export interface Record extends HasTimestamps {
  accountId: ID
  categoryId: ID
  labelIds: ID[]
  value: number
  payee: string | null
  description: string | null
  datetime: string
}

export function createRecord(
  accountId: ID,
  categoryId: ID,
  labelIds: ID[],
  value: number,
  payee: string | null,
  description: string | null,
  datetime: string
): Promise<ID> {
  return DB.then((db) => {
    const now = new Date().toISOString()
    const newRecord = {
      accountId,
      categoryId,
      labelIds,
      value,
      payee,
      description,
      datetime,
      createdAt: now,
      updatedAt: now,
    } as Record
    return db.rel.save('record', newRecord).then(async (res) => {
      await updateBalance(accountId)
      return res
    })
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

export function getAllRecordsOfAccount(id: ID): Promise<RelDocument<Record>[]> {
  return DB.then((db) => db.rel.findHasMany('record', 'accountId', id)).then(
    (res) => res.records
  )
}

export function updateRecord(
  id: ID,
  accountId: ID,
  categoryId: ID,
  labelIds: ID[],
  value: number,
  payee: string | null,
  description: string | null,
  datetime: string
): Promise<void> {
  return DB.then((db) =>
    db.rel.find('record', id).then((res) => {
      const data = res.records[0] as RelDocument<Record>
      if (!data) {
        throw `Could not find record with id=${id}`
      }

      const oldAccountId = data.accountId

      const now = new Date()
      data.accountId = accountId
      data.categoryId = categoryId
      data.labelIds = labelIds
      data.value = value
      data.payee = payee
      data.description = description
      data.datetime = datetime
      data.updatedAt = now.toISOString()

      return db.rel.save('record', data).then(async (res) => {
        const updates = []
        updates.push(updateBalance(accountId))
        if (oldAccountId !== accountId) {
          // if the record was moved to another account, update the balance of both accounts
          updates.push(updateBalance(oldAccountId))
        }
        await Promise.all(updates)
        return res
      })
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
      return db.rel.del('record', data).then(async (res) => {
        await updateBalance(data.accountId)
        return res
      })
    })
  )
}

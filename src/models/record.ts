import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'
import {
  updateBalance,
  updateDebtBalance,
  updateMonthlies,
  updateStartBalance,
} from '@/util'

export interface Record extends HasTimestamps {
  accountId: ID
  categoryId: ID
  labelIds: ID[]
  debtId: ID | null
  transferId: ID | null
  plannedId: ID | null
  value: number
  payee: string | null
  description: string | null
  /**
   * Unix EPOCH
   */
  datetime: number
}

export function createRecord(
  accountId: ID,
  categoryId: ID,
  labelIds: ID[],
  debtId: ID | null,
  transferId: ID | null,
  plannedId: ID | null,
  value: number,
  payee: string | null,
  description: string | null,
  datetime: number,
  doUpdateMonthliesBalance = true
): Promise<ID> {
  return DB.then((db) => {
    const now = new Date().valueOf()
    const newRecord = {
      accountId,
      categoryId,
      labelIds,
      debtId,
      transferId,
      plannedId,
      value,
      payee,
      description,
      datetime,
      createdAt: now,
      updatedAt: now,
    } as Record
    return db.rel.save('record', newRecord).then(async (res) => {
      if (doUpdateMonthliesBalance) {
        await updateMonthlies(accountId, datetime)
        await updateBalance(accountId)
        await updateStartBalance(accountId)
      }
      if (debtId) {
        await updateDebtBalance(debtId)
      }
      return res
    })
  }).then((res) => res.id)
}

export function getRecord(id: ID): Promise<RelDocument<Record> | undefined> {
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

export function getAllRecordsOfAccounts(
  ids: ID[],
  limit: number | null = null,
  asc = true
): Promise<RelDocument<Record>[]> {
  return DB.then((db) => {
    return db
      .find({
        selector: {
          $and: [
            {
              // required to be able to sort by this field
              'data.datetime': {
                $gt: null,
              },
            },
            {
              'data.accountId': {
                $in: ids,
              },
            },
            {
              _id: {
                $gt: db.rel.makeDocID({ type: 'record' }),
                $lt: db.rel.makeDocID({ type: 'record', id: {} }),
              },
            },
          ],
        },
        sort: [{ 'data.datetime': asc ? 'asc' : 'desc' }],
        limit: limit ? limit : 2 ** 32 - 1,
      })
      .then((data) => {
        return db.rel.parseRelDocs('record', data.docs)
      })
      .then((res) => res.records)
  })
}

export function getAllRecordsOfAccountsByDate(
  ids: ID[],
  minDatetime: number | null,
  maxDatetime: number | null,
  limit: number | null = null,
  includeLowerBound: boolean = true,
  includeUpperBound: boolean = false,
  asc = true
): Promise<RelDocument<Record>[]> {
  return DB.then((db) => {
    if (minDatetime === null && maxDatetime === null) {
      throw new Error('One of minDatetime or maxDatetime must be provided')
    }
    const dateTimeFilter: { [x: string]: number } = {}
    if (minDatetime) {
      dateTimeFilter[includeLowerBound ? '$gte' : '$gt'] = minDatetime
    }
    if (maxDatetime) {
      dateTimeFilter[includeUpperBound ? '$lte' : '$lt'] = maxDatetime
    }
    return db
      .find({
        selector: {
          $and: [
            {
              'data.datetime': dateTimeFilter,
            },
            {
              'data.accountId': {
                $in: ids,
              },
            },
            {
              _id: {
                $gt: db.rel.makeDocID({ type: 'record' }),
                $lt: db.rel.makeDocID({ type: 'record', id: {} }),
              },
            },
          ],
        },
        sort: [{ 'data.datetime': asc ? 'asc' : 'desc' }],
        limit: limit ? limit : 2 ** 32 - 1,
      })
      .then((data) => {
        return db.rel.parseRelDocs('record', data.docs)
      })
      .then((res) => res.records)
  })
}

export function getAllRecordsOfDebt(id: ID): Promise<RelDocument<Record>[]> {
  return DB.then((db) => db.rel.findHasMany('record', 'debtId', id)).then(
    (res) => res.records
  )
}

export function updateRecord(
  id: ID,
  accountId: ID,
  categoryId: ID,
  labelIds: ID[],
  transferId: ID | null,
  plannedId: ID | null,
  value: number,
  payee: string | null,
  description: string | null,
  datetime: number
): Promise<void> {
  return DB.then((db) =>
    db.rel.find('record', id).then((res) => {
      const data = res.records[0] as RelDocument<Record>
      if (!id || !data) {
        throw `Could not find record with id=${id}`
      }

      const oldAccountId = data.accountId
      const accountChanged = oldAccountId !== accountId
      const valueChanged = value !== data.value
      const dateChangedBefore = datetime < data.datetime

      const now = new Date().valueOf()
      data.accountId = accountId
      data.categoryId = categoryId
      data.labelIds = labelIds
      data.transferId = transferId
      data.plannedId = plannedId
      data.value = value
      data.payee = payee
      data.description = description
      data.datetime = datetime
      data.updatedAt = now

      return db.rel.save('record', data).then(async (res) => {
        const updates = []
        if (valueChanged || accountChanged) {
          updates.push(
            updateMonthlies(accountId, datetime).then(() =>
              updateBalance(accountId)
            )
          )
          if (accountChanged) {
            // if the record was moved to another account, update the balance of both accounts
            updates.push(
              updateMonthlies(oldAccountId, datetime).then(() =>
                updateBalance(oldAccountId)
              )
            )
          }
          if (accountChanged || dateChangedBefore) {
            updates.push(updateStartBalance(accountId))
          }
        }
        if (valueChanged && data.debtId) {
          updates.push(updateDebtBalance(data.debtId))
        }
        await Promise.all(updates)
        return res
      })
    })
  ).then((res) => res.id)
}

export function deleteRecord(
  id: ID,
  doUpdateMonthliesBalance = true
): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('record', id).then((res) => {
      const data = res.records[0] as RelDocument<Record>
      if (!id || !data) {
        throw `Could not find record with id=${id}`
      }
      return db.rel.del('record', data).then(async (res) => {
        if (doUpdateMonthliesBalance) {
          await updateMonthlies(data.accountId, data.datetime)
          await updateBalance(data.accountId)
        }

        if (data.debtId) {
          await updateDebtBalance(data.debtId)
        }

        // delete associated transfer record
        if (data.transferId) {
          try {
            // always update the transfer's monthlies and balance
            // if the caller doesn't want to update, it's because they will handle it manually. but they cannot know what other accounts where affected by transfers !
            await deleteRecord(data.transferId)
          } catch (e) {
            // ignore if the other record was already deleted
          }
        }
        return res
      })
    })
  )
}

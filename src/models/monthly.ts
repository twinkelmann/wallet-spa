import { DB } from '@/database/db'
import type { ID, RelDocument } from './common'
import { updateBalance } from '@/util'

export interface Monthly {
  accountId: ID
  balance: number
  /**
   * Unix EPOCH
   */
  datetime: number
}

export function createMonthly(
  accountId: ID,
  balance: number,
  datetime: number
): Promise<ID> {
  return DB.then((db) => {
    const newMonthly = {
      accountId,
      balance,
      datetime,
    } as Monthly
    return db.rel.save('monthly', newMonthly).then(async (res) => {
      await updateBalance(accountId)
      return res
    })
  }).then((res) => res.id)
}

export function getMonthly(id: ID): Promise<RelDocument<Monthly> | undefined> {
  return DB.then((db) => db.rel.find('monthly', id)).then(
    (res) => res.monthlies[0]
  )
}

export function getAllMonthliesOfAccount(
  id: ID
): Promise<RelDocument<Monthly>[]> {
  return DB.then((db) => db.rel.findHasMany('monthly', 'accountId', id)).then(
    (res) => res.monthlies
  )
}

export function getAllMonthliesOfAccountByDate(
  id: ID,
  minDatetime: number,
  maxDatetime: number,
  limit: number | null = null,
  includeLowerBound: boolean = true,
  includeUpperBound: boolean = false
): Promise<RelDocument<Monthly>[]> {
  return DB.then((db) => {
    return db
      .find({
        selector: {
          $and: [
            {
              'data.datetime': {
                [includeLowerBound ? '$gte' : '$gt']: minDatetime,
                [includeUpperBound ? '$lte' : '$lt']: maxDatetime,
              },
            },
            {
              'data.accountId': {
                $eq: id,
              },
            },
            {
              _id: {
                $gt: db.rel.makeDocID({ type: 'monthly' }),
                $lt: db.rel.makeDocID({ type: 'monthly', id: {} }),
              },
            },
          ],
        },
        sort: ['data.datetime'],
        limit: limit ? limit : 2 ** 32 - 1,
      })
      .then((data) => {
        return db.rel.parseRelDocs('monthly', data.docs)
      })
      .then((res) => res.monthlies)
  })
}

export function updateMonthly(id: ID, balance: number): Promise<void> {
  return DB.then((db) =>
    db.rel.find('monthly', id).then((res) => {
      const data = res.monthlies[0] as RelDocument<Monthly>
      if (!data) {
        throw `Could not find monthly with id=${id}`
      }

      data.balance = balance

      return db.rel.save('monthly', data).then(async (res) => {
        await updateBalance(data.accountId)
        return res
      })
    })
  ).then((res) => res.id)
}

export function deleteMonthly(
  id: ID,
  doUpdateBalance = true
): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('monthly', id).then((res) => {
      const data = res.monthlies[0] as RelDocument<Monthly>
      if (!data) {
        throw `Could not find monthly with id=${id}`
      }
      return db.rel.del('monthly', data).then(async (res) => {
        if (doUpdateBalance) {
          await updateBalance(data.accountId)
        }
        return res
      })
    })
  )
}

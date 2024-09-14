import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'
import { getAllRecordsOfDebt, updateRecord } from './record'

export interface Debt extends HasTimestamps {
  walletId: ID
  /**
   * Outstanding balance of the debt
   *
   * A positive value means we borrowed money (it's the total of the transactions adding money to the wallet)
   *
   * A negative value means we lent money
   */
  balance: number
  payee: string
  description: string | null
  closed: boolean
}

export function createDebt(
  walletId: ID,
  balance: number,
  payee: string,
  description: string | null
): Promise<ID> {
  return DB.then((db) => {
    const now = new Date().valueOf()
    const newDebt = {
      walletId,
      balance,
      payee,
      description,
      closed: false,
      createdAt: now,
      updatedAt: now,
    } as Debt
    return db.rel.save('debt', newDebt)
  }).then((res) => res.id)
}

export function getDebt(id: ID): Promise<RelDocument<Debt> | undefined> {
  return DB.then((db) => db.rel.find('debt', id)).then((res) => res.debts[0])
}

export function getAllDebtsOfWallet(id: ID): Promise<RelDocument<Debt>[]> {
  return DB.then((db) => db.rel.findHasMany('debt', 'walletId', id)).then(
    (res) => res.debts
  )
}

export function updateDebt(
  id: ID,
  balance: number,
  payee: string,
  description: string | null,
  closed: boolean
): Promise<ID> {
  return DB.then((db) =>
    db.rel.find('debt', id).then((res) => {
      const data = res.debts[0] as RelDocument<Debt>
      if (!id || !data) {
        throw `Could not find debt with id=${id}`
      }

      const payeeChanged = payee !== data.payee

      const now = new Date().valueOf()
      data.balance = balance
      data.payee = payee
      data.description = description
      data.closed = closed
      data.updatedAt = now

      return db.rel.save('debt', data).then(async (res) => {
        // if payee changed, update all records
        if (payeeChanged) {
          const records = await getAllRecordsOfDebt(id)
          for (const r of records) {
            // update sequentially even if that's not very efficient
            // since this is not a recurrent action
            await updateRecord(
              r.id,
              r.accountId,
              r.categoryId,
              r.labelIds,
              null, // debts are not transfers
              null, // debts are not planned
              r.value,
              payee,
              r.description,
              r.datetime
            )
          }
        }

        return res
      })
    })
  ).then((res) => res.id)
}

// TODO: can you really delete a debt ? maybe it doesn't make sense
export function deleteDebt(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('debt', id).then((res) => {
      const data = res.debts[0] as RelDocument<Debt>
      if (!id || !data) {
        throw `Could not find debt with id=${id}`
      }
      // TODO: delete reference from records
      return db.rel.del('debt', data)
    })
  )
}

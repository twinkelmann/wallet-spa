import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'
import { deleteRecord, getAllRecordsOfAccount } from './record'
import { deleteMonthly, getAllMonthliesOfAccount } from './monthly'

export const currencies = ['CHF', 'EUR', 'GBP', 'USD'] as const

export interface Account extends HasTimestamps {
  walletId: ID
  name: string
  color: string
  balance: number
  startBalance: number
  currency: string
}

/**
 * Create a new Account, save it in the database and return it's ID
 * @param wallet ID of the Wallet to associate with
 * @param name Name of the new Account
 * @param color Display color of the new Account as a HEX string
 * @param currency Currency of the new Account
 * @returns The ID of the new Account
 */
export function createAccount(
  walletId: ID,
  name: string,
  color: string,
  startBalance: number,
  currency: string
): Promise<ID> {
  return DB.then((db) => {
    const now = new Date().valueOf()
    const newAccount = {
      walletId,
      name,
      color,
      balance: 0,
      startBalance,
      currency,
      createdAt: now,
      updatedAt: now,
    } as Account
    return db.rel.save('account', newAccount)
  }).then((res) => res.id)
}

export function getAccount(id: ID): Promise<RelDocument<Account> | undefined> {
  return DB.then((db) => db.rel.find('account', id)).then(
    (res) => res.accounts[0]
  )
}

export function getAllAccounts(): Promise<RelDocument<Account>[]> {
  return DB.then((db) => db.rel.find('account')).then((res) => res.accounts)
}

export function getAllAccountsOfWallet(
  id: ID
): Promise<RelDocument<Account>[]> {
  return DB.then((db) => db.rel.findHasMany('account', 'walletId', id)).then(
    (res) => res.accounts
  )
}

export function updateAccount(
  id: ID,
  name: string,
  color: string,
  balance: number,
  startBalance: number,
  currency: string
): Promise<ID> {
  return DB.then((db) =>
    db.rel.find('account', id).then((res) => {
      const data = res.accounts[0] as RelDocument<Account>
      if (!id || !data) {
        throw `Could not find account with id=${id}`
      }

      const now = new Date().valueOf()
      data.name = name
      data.color = color
      data.balance = balance
      data.startBalance = startBalance
      data.currency = currency
      data.updatedAt = now

      return db.rel.save('account', data)
    })
  ).then((res) => res.id)
}

export function deleteAccount(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('account', id).then((res) => {
      const data = res.accounts[0] as RelDocument<Account>
      if (!id || !data) {
        throw `Could not find account with id=${id}`
      }
      return db.rel.del('account', data).then(async (res) => {
        if (res.deleted) {
          await getAllRecordsOfAccount(id).then((records) =>
            Promise.all(records.map((r) => deleteRecord(r.id, false)))
          )
          await getAllMonthliesOfAccount(id).then((monthlies) =>
            Promise.all(monthlies.map((m) => deleteMonthly(m.id, false)))
          )
        }
        return res
      })
    })
  )
}

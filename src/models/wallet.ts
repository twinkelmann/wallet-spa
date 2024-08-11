import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'
import { deleteAccount, getAllAccountsOfWallet } from './account'
import {
  deleteCategory,
  getAllCategoriesOfWallet,
  insertDefaultCategoryTree,
} from './category'
import { deleteLabel, getAllLabelsOfWallet } from './label'

// TODO: add setting for number of decimals ?
export interface Wallet extends HasTimestamps {
  name: string
}

/**
 * Create a new Wallet, save it in the database and return it's ID
 * @param name Name of the new Wallet
 * @returns The ID of the new Wallet
 */
export function createWallet(name: string): Promise<ID> {
  return DB.then((db) => {
    const now = new Date().valueOf()
    const newWallet = {
      name,
      createdAt: now,
      updatedAt: now,
    } as Wallet
    return db.rel.save('wallet', newWallet)
  }).then(async (res) => {
    await insertDefaultCategoryTree(res.id)
    return res.id
  })
}

export function getWallet(id: ID): Promise<RelDocument<Wallet> | undefined> {
  return DB.then((db) => db.rel.find('wallet', id)).then(
    (res) => res.wallets[0]
  )
}

export function getAllWallets(): Promise<RelDocument<Wallet>[]> {
  return DB.then((db) => db.rel.find('wallet')).then((res) => res.wallets)
}

export function updateWallet(id: ID, name: string): Promise<ID> {
  return DB.then((db) =>
    db.rel.find('wallet', id).then((res) => {
      const data = res.wallets[0] as RelDocument<Wallet>
      if (!id || !data) {
        throw `Could not find wallet with id=${id}`
      }

      const now = new Date().valueOf()
      data.name = name
      data.updatedAt = now

      // TODO: handle conflicts https://github.com/pouchdb-community/relational-pouch?tab=readme-ov-file#managing-revisions-rev
      return db.rel.save('wallet', data)
    })
  ).then((res) => res.id)
}

export function deleteWallet(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('wallet', id).then((res) => {
      const data = res.wallets[0] as RelDocument<Wallet>
      if (!id || !data) {
        throw `Could not find wallet with id=${id}`
      }
      return db.rel.del('wallet', data).then(async (res) => {
        if (res.deleted) {
          await getAllAccountsOfWallet(id).then((accounts) =>
            Promise.all(accounts.map((a) => deleteAccount(a.id)))
          )
          await getAllCategoriesOfWallet(id).then((categories) =>
            Promise.all(categories.map((c) => deleteCategory(c.id)))
          )
          await getAllLabelsOfWallet(id).then((labels) =>
            Promise.all(labels.map((l) => deleteLabel(l.id)))
          )
        }
        return res
      })
    })
  )
}

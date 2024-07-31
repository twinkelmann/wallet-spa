import { DB } from '@/database/db'
import type { HasTimestamps, ID, RelDocument } from './common'

export interface Wallet extends HasTimestamps {
  accounts: ID[]
  name: string
}

/**
 * Create a new Wallet, save it in the database and return it's ID
 * @param name Name of the new Wallet
 * @returns The ID of the new Wallet
 */
export function createWallet(name: string): Promise<ID> {
  return DB.then((db) => {
    const now = new Date()
    const newWallet = {
      name,
      createdAt: now,
      updatedAt: new Date(now),
    } as Wallet
    return db.rel.save('wallet', newWallet)
  }).then((res) => res.id)
}

export function getWallet(id: ID): Promise<RelDocument<Wallet>> {
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
      if (!data) {
        throw `Could not find wallet with id=${id}`
      }

      const now = new Date()
      data.name = name
      data.updatedAt = now

      return db.rel.save('wallet', data)
    })
  ).then((res) => res.id)
}

export function deleteWallet(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('wallet', id).then((res) => {
      const data = res.wallets[0] as RelDocument<Wallet>
      if (!data) {
        throw `Could not find wallet with id=${id}`
      }
      // TODO: Delete associated accounts
      return db.rel.del('wallet', data)
    })
  )
}

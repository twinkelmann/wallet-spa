import Pouch from 'pouchdb'
import find from 'pouchdb-find'
import rel from 'relational-pouch'

Pouch.plugin(find)
Pouch.plugin(rel)

const DB_NAME = 'wallet'

export const DB: Promise<PouchDB.RelDatabase> = new Promise(
  async (resolve, reject) => {
    const db = new Pouch(DB_NAME)
    const relDB = db.setSchema([
      {
        singular: 'account',
        plural: 'accounts',
        relations: {
          walletId: { belongsTo: { type: 'wallet', options: { async: true } } },
        },
      },
      {
        singular: 'category',
        plural: 'categories',
        relations: {
          walletId: { belongsTo: { type: 'wallet', options: { async: true } } },
          categoryId: {
            belongsTo: { type: 'category', options: { async: true } },
          },
        },
      },
      {
        singular: 'label',
        plural: 'labels',
        relations: {
          walletId: { belongsTo: { type: 'wallet', options: { async: true } } },
        },
      },
      {
        singular: 'monthly',
        plural: 'monthlies',
        relations: {
          accountId: {
            belongsTo: { type: 'account', options: { async: true } },
          },
        },
      },
      {
        singular: 'record',
        plural: 'records',
        relations: {
          accountId: {
            belongsTo: { type: 'account', options: { async: true } },
          },
          categoryId: {
            belongsTo: { type: 'category', options: { async: true } },
          },
          labelIds: {
            hasMany: { type: 'label', options: { async: true } },
          },
        },
      },
      {
        singular: 'wallet',
        plural: 'wallets',
      },
    ])
    try {
      // To look up children of wallet (account)
      await db.createIndex({
        index: {
          name: 'idx-wallet',
          ddoc: 'idx-wallet',
          fields: ['data.walletId', '_id'],
        },
      })
      // To look up children of account (record, monthly)
      // TODO: check if flipping order is faster with many records
      await db.createIndex({
        index: {
          name: 'idx-account',
          ddoc: 'idx-account',
          fields: ['data.accountId', '_id'],
        },
      })
      // To look up children of category (record, category)
      await db.createIndex({
        index: {
          name: 'idx-category',
          ddoc: 'idx-category',
          fields: ['data.categoryId', '_id'],
        },
      })
      console.log('DB open')
      // TODO: remove
      ;(window as any).db = relDB
      resolve(relDB)
    } catch (e) {
      reject(e)
    }
  }
)

import Pouch from 'pouchdb'
import rel from 'relational-pouch'

Pouch.plugin(rel)

const DB_NAME = 'wallet'

export const DB: Promise<PouchDB.RelDatabase> = new Promise(
  (resolve, reject) => {
    const db = new Pouch(DB_NAME)
    // TODO: use lazy load where it makes sense, remove hasMany and add indices for reverse lookup
    // https://github.com/pouchdb-community/relational-pouch?tab=readme-ov-file#dont-save-hasmany
    const relDB = db.setSchema([
      {
        singular: 'account',
        plural: 'accounts',
        relations: {
          wallet: { belongsTo: 'wallet' },
          records: { hasMany: 'record' },
          monthlies: { hasMany: 'monthly' },
        },
      },
      {
        singular: 'category',
        plural: 'categories',
        relations: {
          wallet: { belongsTo: 'wallet' },
          records: { hasMany: 'record' },
          categories: { hasMany: 'category' },
          category: { belongsTo: 'category' },
        },
      },
      {
        singular: 'monthly',
        plural: 'monthlies',
        relations: { account: { belongsTo: 'account' } },
      },
      {
        singular: 'record',
        plural: 'records',
        relations: {
          account: { belongsTo: 'account' },
          category: { belongsTo: 'category' },
        },
      },
      {
        singular: 'wallet',
        plural: 'wallets',
        relations: { accounts: { hasMany: 'account' } },
      },
    ])
    console.log('DB open')
    resolve(relDB)
  }
)

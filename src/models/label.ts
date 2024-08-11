import { DB } from '@/database/db'
import type { ID, RelDocument } from './common'

export interface Label {
  walletId: ID
  name: string
  color: string
}

export function createLabel(
  walletId: ID,
  name: string,
  color: string
): Promise<ID> {
  return DB.then((db) => {
    const newLabel = {
      walletId,
      name,
      color,
    } as Label
    return db.rel.save('label', newLabel)
  }).then((res) => res.id)
}

export function getLabel(id: ID): Promise<RelDocument<Label> | undefined> {
  return DB.then((db) => db.rel.find('label', id)).then((res) => res.labels[0])
}

export function getAllLabelsOfWallet(id: ID): Promise<RelDocument<Label>[]> {
  return DB.then((db) => db.rel.findHasMany('label', 'walletId', id)).then(
    (res) => res.labels
  )
}

export function updateLabel(id: ID, name: string, color: string): Promise<ID> {
  return DB.then((db) =>
    db.rel.find('label', id).then((res) => {
      const data = res.labels[0] as RelDocument<Label>
      if (!data) {
        throw `Could not find label with id=${id}`
      }

      data.name = name
      data.color = color

      return db.rel.save('label', data)
    })
  ).then((res) => res.id)
}

export function deleteLabel(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('label', id).then((res) => {
      const data = res.labels[0] as RelDocument<Label>
      if (!data) {
        throw `Could not find label with id=${id}`
      }
      // TODO: delete reference from records
      return db.rel.del('label', data)
    })
  )
}

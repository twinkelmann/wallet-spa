import { DB } from '@/database/db'
import type { ID, RelDocument } from './common'

export interface Category {
  walletId: ID
  categoryId?: ID
  name: string
  color: string
  icon: string
}

export function createCategory(
  walletId: ID,
  name: string,
  color: string,
  icon: string,
  categoryId?: ID
): Promise<ID> {
  return DB.then((db) => {
    const newCategory = {
      walletId,
      categoryId,
      name,
      color,
      icon,
    } as Category
    return db.rel.save('category', newCategory)
  }).then((res) => res.id)
}

export function getCategory(
  id: ID
): Promise<RelDocument<Category> | undefined> {
  return DB.then((db) => db.rel.find('category', id)).then(
    (res) => res.categories[0]
  )
}

export function getAllCategoriesOfWallet(
  id: ID
): Promise<RelDocument<Category>[]> {
  return DB.then((db) => db.rel.findHasMany('category', 'walletId', id)).then(
    (res) => res.categories
  )
}

export function deleteCategory(id: ID): Promise<{ deleted: boolean }> {
  return DB.then((db) =>
    db.rel.find('category', id).then((res) => {
      const data = res.categories[0] as RelDocument<Category>
      if (!id || !data) {
        throw `Could not find category with id=${id}`
      }
      // TODO: delete reference from records
      return db.rel.del('category', data)
    })
  )
}

// Import Logic

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
}

async function recursiveInsert(
  walletId: ID,
  children: CategoryWithChildren[],
  parent?: ID
) {
  for (const cat of children) {
    const id = await createCategory(
      walletId,
      cat.name,
      cat.color,
      cat.icon,
      parent
    )
    if (cat.children.length > 0) {
      await recursiveInsert(walletId, cat.children, id)
    }
  }
}

export enum CategoryTemplates {
  DEFAULT = 'default',
  BUSINESS = 'business',
}

export const allCategoryTemplates = [
  CategoryTemplates.DEFAULT,
  CategoryTemplates.BUSINESS,
]

const categoryTemplateFiles = new Map<CategoryTemplates, string>([
  [CategoryTemplates.DEFAULT, '/assets/defaultCategories.json'],
  [CategoryTemplates.BUSINESS, '/assets/businessCategories.json'],
])

export async function insertCategoryTreeTemplate(
  walletId: ID,
  template: CategoryTemplates
): Promise<void> {
  const templateFile = categoryTemplateFiles.get(template)!
  const res = await fetch(templateFile)
  const json = (await res.json()) as CategoryWithChildren[]
  return recursiveInsert(walletId, json)
}

import type { ID } from './common'

export interface Category {
  walletId: ID
  categoryId?: ID
  name: string
  color: string
  icon: string
}
/*

export async function getDefaultCategoryTree(): Promise<Category[]> {
  const res = await fetch('/src/assets/defaultCategories.json')
  const json = (await res.json()) as any[]
  const addId = (x: Category): Category => ({
    ...x,
    id: crypto.randomUUID(),
    children: x.children?.length ? x.children.map(addId) : null,
  })
  return json.map(addId)
}
*/

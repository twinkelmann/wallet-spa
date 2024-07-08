import type { HasId } from './common'

export interface Category extends HasId {
  name: string
  color: string
  icon: string
  children: Category[] | null
}

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

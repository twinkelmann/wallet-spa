import type { HasId, HasTimestamps, UUID } from './common'

export interface Record extends HasId, HasTimestamps {
  accountId: UUID
  value: number
  payee: string | null
  description: string | null
  datetime: Date
}

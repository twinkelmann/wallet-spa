import type { UUID } from './common'

export interface Monthly {
  accountId: UUID
  balance: number
  datetime: Date
}

import type { UUID } from './common'

export interface Monthly {
  accountId: UUID
  balance: number
  /**
   * ISO DateTime String
   */
  datetime: string
}

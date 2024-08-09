import type { ID } from './common'

export interface Monthly {
  accountId: ID
  balance: number
  /**
   * ISO DateTime String
   */
  datetime: string
}

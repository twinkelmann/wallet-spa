import type { ID } from './common'

export interface Monthly {
  accountId: ID
  balance: number
  /**
   * Unix EPOCH
   */
  datetime: number
}

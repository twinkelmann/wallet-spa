import type { ID } from './common'

export interface Monthly {
  account: ID
  balance: number
  /**
   * ISO DateTime String
   */
  datetime: string
}

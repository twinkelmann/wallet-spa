import type { HasId, HasTimestamps, UUID } from './common'

export const currencies = ['CHF', 'EUR', 'GBP', 'USD'] as const

export interface Account extends HasId, HasTimestamps {
  walletId: UUID
  name: string
  color: string
  balance: number
  startBalance: number
  currency: string
}

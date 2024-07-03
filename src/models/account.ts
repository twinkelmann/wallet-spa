import type { HasId, HasTimestamps, UUID } from './common'

export interface Currency {
  name: string
  code: string
  unit: string
  plural: string
  symbol: string
}

export const currencies: Currency[] = [
  {
    name: 'Swiss franc',
    code: 'CHF',
    unit: 'franc',
    plural: 'francs',
    symbol: 'CHF',
  },
  {
    name: 'Euro',
    code: 'EUR',
    unit: 'euro',
    plural: 'euros',
    symbol: '€',
  },
  {
    name: 'Pound sterling',
    code: 'GBP',
    unit: 'pound',
    plural: 'pounds',
    symbol: '£',
  },
  {
    name: 'United States dollar',
    code: 'USD',
    unit: 'dollar',
    plural: 'dollars',
    symbol: '$',
  },
]

export interface Account extends HasId, HasTimestamps {
  walletId: UUID
  name: string
  color: string
  balance: number
  startBalance: number
  currency: Currency
}

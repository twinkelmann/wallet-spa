import type { HasId, HasTimestamps } from './common'

export interface Wallet extends HasId, HasTimestamps {
  name: string
}

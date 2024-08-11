import type { Wallet } from '@/models/wallet'
import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import type { ID, RelDocument } from '@/models/common'

export const useStateStore = defineStore('state', () => {
  // TODO: probably only store the wallet ID
  const activeWallet: Ref<RelDocument<Wallet> | undefined> = ref(undefined)
  const shownAccounts: Ref<Set<ID>> = ref(new Set())

  return {
    activeWallet,
    shownAccounts,
  }
})

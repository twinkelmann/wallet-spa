import type { Wallet } from '@/models/wallet'
import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue'
import { useWalletsStore } from './wallets'
import type { ID, RelDocument } from '@/models/common'
import type { Account } from '@/models/account'

export const useStateStore = defineStore('state', () => {
  const wallets = useWalletsStore()
  const activeWallet: Ref<RelDocument<Wallet> | null> = ref(null)
  const shownAccounts: Ref<Account[]> = ref([])

  const activeAccounts = computed(() => {
    return wallets.accounts.filter((a) => a.walletId === activeWallet.value?.id)
  })

  const activeRecords = computed(() => {
    const accounts =
      shownAccounts.value.length > 0 ? shownAccounts : activeAccounts
    const accountIds = new Set(accounts.value.map((a) => a.id))
    return wallets.records.filter((r) => accountIds.has(r.accountId))
  })

  const accountById = computed(() => {
    const byId: Record<ID, Account> = {}
    wallets.accounts.forEach((a) => (byId[a.id] = a))
    return byId
  })

  const walletById = computed(() => {
    const byId: Record<ID, Wallet> = {}
    wallets.wallets.forEach((a) => (byId[a.id] = a))
    return byId
  })

  return {
    activeWallet,
    shownAccounts,
    activeAccounts,
    activeRecords,
    accountById,
    walletById,
  }
})

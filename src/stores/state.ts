import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import type { ID } from '@/models/common'

export const useStateStore = defineStore('state', () => {
  const activeWallet: Ref<ID | undefined> = ref(undefined)
  const shownAccounts: Ref<Set<ID>> = ref(new Set())

  return {
    activeWallet,
    shownAccounts,
  }
})

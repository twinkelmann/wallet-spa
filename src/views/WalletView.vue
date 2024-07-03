<script setup lang="ts">
import AccountsWidget from '@/components/widgets/AccountsWidget.vue'
import Records from '@/components/Records.vue'
import type { UUID } from '@/models/common'
import { useStateStore } from '@/stores/state'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const state = useStateStore()

// Try to auto-select wallet based on URL
state.activeWallet = state.walletById[route.params.id as UUID] || null
state.shownAccounts = []
if (state.activeWallet === null) {
  // If the wallet is not found, redirect to home page
  router.replace('/')
}
</script>

<template>
  <main class="flex flex-col">
    <header class="mb-4 flex h-12 items-center justify-between bg-gray-100">
      <button class="material-icons nt-focus-ring p-4">menu</button>
      <h1 class="mx-2 truncate">{{ state.activeWallet?.name }}</h1>
      <RouterLink class="material-icons nt-focus-ring p-4" to="/">
        home
      </RouterLink>
    </header>
    <AccountsWidget></AccountsWidget>
    <Records></Records>
  </main>
</template>

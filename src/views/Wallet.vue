<script setup lang="ts">
import Menu from '@/components/Menu.vue'
import type { UUID } from '@/models/common'
import { useStateStore } from '@/stores/state'
import { ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

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

router.afterEach(() => (show.value = false))

const show = ref(false)
</script>

<template>
  <main class="flex flex-col">
    <header class="mb-4 flex h-12 items-center justify-between bg-gray-100">
      <button class="material-icons nt-focus-ring p-4" @click="show = !show">
        menu
      </button>
      <h1 class="mx-2 truncate">{{ state.activeWallet?.name }}</h1>
      <RouterLink class="material-icons nt-focus-ring p-4" to="/">
        home
      </RouterLink>
    </header>
    <RouterView />
    <Teleport to="body">
      <Menu :show="show" @close="show = false"></Menu>
    </Teleport>
  </main>
</template>

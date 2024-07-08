<script setup lang="ts">
import Menu from '@/components/Menu.vue'
import { getDefaultCategoryTree } from '@/models/category'
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

getDefaultCategoryTree().then(console.log)
</script>

<template>
  <main class="flex">
    <Menu :show="show" @close="show = false"></Menu>
    <div class="flex grow flex-col">
      <header
        class="mb-4 flex h-12 w-full items-center justify-between bg-gray-100"
      >
        <button
          class="material-icons nt-focus-ring p-4 md:pointer-events-none md:opacity-0"
          @click="show = !show"
          title="Toggle Menu"
        >
          menu
        </button>
        <h1 class="mx-2 truncate">{{ state.activeWallet?.name }}</h1>
        <RouterLink
          class="material-icons nt-focus-ring p-4"
          to="/"
          title="Back to Wallet selection"
        >
          home
        </RouterLink>
      </header>
      <RouterView />
    </div>
  </main>
</template>

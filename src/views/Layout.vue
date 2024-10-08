<script setup lang="ts">
import Menu from '@/components/Menu.vue'
import type { RelDocument } from '@/models/common'
import { getWallet, type Wallet } from '@/models/wallet'
import { useStateStore } from '@/stores/state'
import type { Ref } from 'vue'
import { computed } from 'vue'
import { onMounted } from 'vue'
import { ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const state = useStateStore()

router.afterEach(() => (show.value = false))

const wallet: Ref<RelDocument<Wallet> | undefined> = ref(undefined)
const show = ref(false)

const hideMenu = computed(() => route.meta.hideMenu as boolean)

function attemptBack() {
  if (window.history.state.back) {
    router.back()
  } else {
    router.push(`/wallets/${route.params.id}`)
  }
}

onMounted(async () => {
  // Try to auto-select wallet based on URL
  const id = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id
  wallet.value = await getWallet(id)
  if (!wallet.value) {
    // If the wallet is not found, redirect to home page
    router.replace('/')
  } else {
    state.activeWallet = id
    state.shownAccounts = new Set()
  }
})
</script>

<template>
  <main class="flex">
    <Menu v-if="!hideMenu" :show="show" @close="show = false"></Menu>
    <div class="relative flex grow flex-col">
      <header
        class="mb-4 flex w-full items-center justify-between text-lg print:shrink-0"
      >
        <button
          :class="`material-icons nt-clickable nt-focus-ring p-4 print:hidden ${hideMenu ? '' : 'md:pointer-events-none md:opacity-0'}`"
          @click="hideMenu ? attemptBack() : (show = !show)"
          :title="hideMenu ? 'Back' : 'Toggle Menu'"
        >
          {{ hideMenu ? 'arrow_back_ios_new' : 'menu' }}
        </button>
        <h1 class="mx-2 w-0 grow truncate text-center">
          {{ wallet?.name }}
        </h1>
        <RouterLink
          class="material-icons nt-clickable nt-focus-ring p-4 print:hidden"
          to="/"
          :title="$t('wallet.back')"
        >
          home
        </RouterLink>
      </header>
      <RouterView />
    </div>
  </main>
</template>

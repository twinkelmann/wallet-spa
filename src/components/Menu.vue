<script setup lang="ts">
import { menuEntries } from '@/router'
import { useStateStore } from '@/stores/state'
import { computed } from 'vue'
import { version } from '../../package.json'
import LocaleSelector from './LocaleSelector.vue'
import ThemeSelector from './ThemeSelector.vue'

defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const state = useStateStore()
const basePath = computed(() => `/wallets/${state.activeWallet}`)
</script>
<template>
  <div
    :class="`fixed left-0 top-0 z-[2000] h-full w-full shrink-0 bg-black/75 transition-opacity md:relative md:w-64 md:bg-transparent ${show ? 'pointer-events-auto opacity-100' : 'max-md:pointer-events-none max-md:opacity-0'}`"
    @click="$emit('close')"
  >
    <ul
      :class="`flex h-full w-3/4 flex-col overflow-y-auto overscroll-contain bg-white shadow-2xl transition-transform dark:bg-zinc-900 dark:shadow-none md:fixed md:w-64 md:shadow-lg print:overflow-hidden ${show ? 'translate-x-0' : 'max-md:-translate-x-full'}`"
      @click="$event.stopPropagation()"
    >
      <li v-for="entry in menuEntries" :key="entry.path">
        <RouterLink
          :to="`${basePath}/${entry.path}`"
          class="nt-focus-ring m-2 flex items-center rounded-lg p-3"
          exactActiveClass="wallet-secondary"
          ><i class="material-icons mr-2">{{ entry.icon }}</i>
          <span class="first-letter:uppercase">{{
            $t(entry.name as string, 2)
          }}</span>
        </RouterLink>
      </li>
      <li class="m-4">
        <ThemeSelector></ThemeSelector>
      </li>
      <li class="m-4">
        <LocaleSelector></LocaleSelector>
      </li>
      <li class="mb-4 mt-auto flex flex-col items-center">
        <span class="flex items-center gap-2"
          ><i class="material-icons">account_balance_wallet</i>
          <span>Wallet</span>
          <span class="font-mono text-sm">v{{ version }}</span></span
        >
        <span
          >&copy; {{ new Date().getFullYear() }} -
          <a
            class="text-emerald-800 underline dark:text-emerald-200"
            href="https://naito.one"
            >Naito One</a
          ></span
        >
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { menuEntries } from '@/router'
import { useStateStore } from '@/stores/state'
import { computed } from 'vue'
import { version } from '../../package.json'
import LocaleSelector from './LocaleSelector.vue'

defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const state = useStateStore()
const basePath = computed(() => `/wallets/${state.activeWallet?.id}`)
</script>
<template>
  <div
    :class="`absolute left-0 top-0 z-[2000] h-screen w-screen shrink-0 bg-black/75 transition-opacity md:relative md:w-64 md:bg-transparent ${show ? 'pointer-events-auto opacity-100' : 'max-md:pointer-events-none max-md:opacity-0'}`"
    @click="$emit('close')"
  >
    <ul
      :class="`menu-container flex h-full w-3/4 flex-col bg-white shadow-2xl transition-transform md:fixed md:w-64 md:shadow-lg ${show ? 'translate-x-0' : 'max-md:-translate-x-full'}`"
      @click="$event.stopPropagation()"
    >
      <li
        v-for="entry in menuEntries"
        :key="entry.path"
        class="border-b border-gray-100"
      >
        <RouterLink
          :to="`${basePath}/${entry.path}`"
          class="flex h-full w-full items-center p-4"
          exactActiveClass="bg-gray-100"
          ><i class="material-icons mr-2">{{ entry.icon }}</i>
          <span class="first-letter:uppercase">{{
            $t(entry.name as string, 2)
          }}</span>
        </RouterLink>
      </li>
      <li>
        <button>Dark Mode</button>
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
          <a class="text-emerald-800 underline" href="https://naito.one"
            >Naito One</a
          ></span
        >
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { menuEntries } from '@/router'
import { useStateStore } from '@/stores/state'
import { computed } from 'vue'
import { version } from '../../package.json'

defineProps<{ show: boolean }>()
defineEmits<{ (e: 'close'): void }>()

const state = useStateStore()
const basePath = computed(() => `/wallets/${state.activeWallet?.id}`)
</script>
<template>
  <Transition name="menu">
    <div
      v-if="show"
      class="absolute left-0 top-0 z-[2000] h-screen w-screen bg-black/75 transition-opacity"
      @click="$emit('close')"
    >
      <ul
        class="menu-container flex h-full w-3/4 flex-col bg-white shadow-2xl transition-transform"
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
            ><i class="material-icons mr-2">{{ entry.icon }}</i>
            {{ entry.name }}</RouterLink
          >
        </li>
        <li>
          <button>Dark Mode</button>
        </li>
        <li>
          <button>Language</button>
        </li>
        <li class="mt-auto flex flex-col items-center">
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
  </Transition>
</template>
<style>
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

.menu-enter-from .menu-container,
.menu-leave-to .menu-container {
  transform: translateX(-100vw);
}

.menu-container .router-link-exact-active {
  @apply bg-gray-100;
}
</style>

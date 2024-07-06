<script setup lang="ts">
import { type Account } from '@/models/account'
import { ref } from 'vue'
import { useStateStore } from '@/stores/state'
import BaseModal from '../BaseModal.vue'
import Color from 'colorjs.io'
import AccountForm from '../forms/AccountForm.vue'

const state = useStateStore()

function toggleShowAccount(account: Account) {
  const index = state.shownAccounts.indexOf(account)
  if (index !== -1) {
    state.shownAccounts.splice(index, 1)
  } else {
    state.shownAccounts.push(account)
  }
}

const showModal = ref(false)

const black = new Color('black')
const white = new Color('white')
function useBlackText(backgroundColor: string) {
  console.log('called useBlackText')
  const background = new Color(backgroundColor)
  const cBlack = background.contrast(black, 'APCA')
  const cWhite = background.contrast(white, 'APCA')
  return Math.abs(cBlack) > Math.abs(cWhite)
}
</script>

<template>
  <div class="mx-4 flex items-center justify-between">
    <h2 class="text-lg font-medium">List of accounts</h2>
    <RouterLink
      :to="`/wallets/${state.activeWallet?.id}/accounts`"
      class="material-icons nt-focus-ring p-4"
      >settings</RouterLink
    >
  </div>
  <ul class="flex flex-wrap justify-between p-3 sm:justify-center">
    <li
      class="w-1/2 p-1 sm:w-72"
      v-for="account of state.activeAccounts"
      :key="account.id"
    >
      <div
        :style="`background-color: ${account.color}`"
        :class="`nt-clickable flex flex-col rounded-md p-2 ${
          useBlackText(account.color) ? 'text-black' : 'text-white'
        } ${
          state.shownAccounts.length > 0 &&
          !state.shownAccounts.includes(account)
            ? 'brightness-150 contrast-50 grayscale'
            : ''
        }`"
        @click="toggleShowAccount(account)"
      >
        <span class="truncate text-sm">{{ account.name }}</span>
        <span>{{ account.currency.code }} {{ account.balance }}</span>
      </div>
    </li>
    <li class="w-1/2 p-1 sm:w-72">
      <button
        class="h-full w-full rounded-md border border-gray-400 p-2 text-gray-600"
        @click="showModal = true"
      >
        Create Account
      </button>
    </li>
  </ul>
  <Teleport to="body">
    <BaseModal
      header="Create Account"
      :show="showModal"
      @close="showModal = false"
    >
      <div class="p-4" v-if="state.activeWallet">
        <AccountForm
          :wallet-id="state.activeWallet.id"
          :account="null"
          @done="showModal = false"
        ></AccountForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

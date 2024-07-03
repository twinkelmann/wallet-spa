<script setup lang="ts">
import { currencies, type Account } from '@/models/account'
import { useWalletsStore } from '@/stores/wallets'
import { ref } from 'vue'
import { useStateStore } from '@/stores/state'
import BaseModal from '../BaseModal.vue'
import type { UUID } from '@/models/common'
import Color from 'colorjs.io'

const state = useStateStore()
const wallets = useWalletsStore()

const name = ref('')
const color = ref('#FF0000')
const currency = ref(currencies[0])

function createAccount() {
  if (state.activeWallet) {
    showModal.value = false
    wallets.createAccount(
      state.activeWallet.id,
      name.value,
      color.value,
      currency.value
    )
  }
}

function deleteAccount(id: UUID) {
  if (confirm('Delete Account ?')) {
    wallets.deleteAccount(id)
  }
}

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
      header="New Account"
      :show="showModal"
      @close="showModal = false"
    >
      <div class="flex flex-col gap-2 p-4">
        <label class="nt-form-label" for="new-account-name">Account Name</label>
        <input
          class="nt-form-input"
          v-model="name"
          type="text"
          name="new-account-name"
          id="new-account-name"
        />
        <label class="nt-form-label" for="new-account-color"
          >Account Color</label
        >
        <input
          class="nt-form-color-input"
          v-model="color"
          type="color"
          name="new-account-color"
          id="new-account-color"
        />
        <label class="nt-form-label" for="new-account-currency"
          >Account Currency</label
        >
        <label class="nt-select" for="new-account-currency">
          <select
            class="nt-form-input"
            v-model="currency"
            name="new-account-currency"
            id="new-account-currency"
          >
            <option
              v-for="currency of currencies"
              :key="currency.code"
              :value="currency"
            >
              {{ currency.name }} ({{ currency.code }})
            </option>
          </select>
        </label>
        <button
          class="nt-button mt-2 bg-emerald-800 px-4"
          @click="createAccount()"
          :disabled="!name.trim()"
        >
          Create
        </button>
      </div>
    </BaseModal>
  </Teleport>
</template>

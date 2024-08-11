<script setup lang="ts">
import { ref } from 'vue'
import { useStateStore } from '@/stores/state'
import BaseModal from '../BaseModal.vue'
import AccountForm from '../forms/AccountForm.vue'
import { useSettingsStore } from '@/stores/settings'
import type { ID, RelDocument } from '@/models/common'
import type { Account } from '@/models/account'
import { useBlackText } from '@/util'
import { computed } from 'vue'

const props = defineProps<{ accounts: RelDocument<Account>[] }>()

const state = useStateStore()
const settings = useSettingsStore()

function toggleShowAccount(accountId: ID) {
  if (state.shownAccounts.has(accountId)) {
    state.shownAccounts.delete(accountId)
  } else {
    state.shownAccounts.add(accountId)
  }
}

const orderedAccounts = computed(() =>
  props.accounts.sort((a, b) => a.name.localeCompare(b.name))
)

const showModal = ref(false)
</script>
<template>
  <div class="mx-4 flex items-center justify-between">
    <h2 class="text-lg font-medium">{{ $t('widgets.accounts.title', 2) }}</h2>
    <RouterLink
      :to="`/wallets/${state.activeWallet}/accounts`"
      class="material-icons nt-clickable nt-focus-ring rounded-full p-4 print:hidden"
      >settings</RouterLink
    >
  </div>
  <ul class="flex flex-wrap justify-between p-3 sm:justify-center">
    <li
      class="w-1/2 p-1 sm:w-72"
      v-for="account of orderedAccounts"
      :key="account.id"
    >
      <div
        :style="`background-color: ${account.color}`"
        :class="`nt-clickable flex flex-col rounded-md p-2 ${
          useBlackText(account.color) ? 'text-black' : 'text-white'
        } ${
          state.shownAccounts.size > 0 && !state.shownAccounts.has(account.id)
            ? 'brightness-150 contrast-50 grayscale'
            : ''
        }`"
        @click="toggleShowAccount(account.id)"
      >
        <span class="truncate text-sm">{{ account.name }}</span>
        <span>{{
          (account.balance + account.startBalance).toLocaleString(
            settings.numberLocale,
            {
              style: 'currency',
              currency: account.currency,
            }
          )
        }}</span>
      </div>
    </li>
    <li class="w-1/2 p-1 sm:w-72 print:hidden">
      <button
        class="h-full w-full rounded-md border border-gray-400 p-2 text-gray-600 first-letter:uppercase"
        @click="showModal = true"
      >
        {{ $t('create.account') }}
      </button>
    </li>
  </ul>
  <Teleport to="body">
    <BaseModal
      :header="$t('create.account')"
      :show="showModal"
      @close="showModal = false"
    >
      <div class="p-4" v-if="state.activeWallet">
        <AccountForm
          :wallet-id="state.activeWallet"
          :account="null"
          @done="showModal = false"
        ></AccountForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

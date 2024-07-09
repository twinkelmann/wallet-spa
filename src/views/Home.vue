<script setup lang="ts">
import { useWalletsStore } from '@/stores/wallets'
import { ref } from 'vue'
import BaseModal from '../components/BaseModal.vue'
import WalletForm from '../components/forms/WalletForm.vue'
import type { Ref } from 'vue'
import type { Wallet } from '@/models/wallet'

const wallets = useWalletsStore()

const editedWallet: Ref<Wallet | null> = ref(null)
const showModal = ref(false)

function createWallet() {
  editedWallet.value = null
  showModal.value = true
}

function updateWallet(wallet: Wallet) {
  editedWallet.value = wallet
  showModal.value = true
}

function deleteWallet(wallet: Wallet) {
  if (confirm('Delete Wallet ?')) {
    wallets.deleteWallet(wallet.id)
  }
}
</script>

<template>
  <main class="flex flex-col items-center">
    <h1 class="mb-4 mt-12 flex items-center text-3xl">
      <i class="material-icons mr-2">account_balance_wallet</i> Wallet
    </h1>
    <span class="mb-8 text-center"
      >Please select a wallet or create a new one</span
    >
    <ul class="flex w-full flex-col gap-2 p-4 sm:w-2/3 md:w-1/2 lg:w-1/3">
      <li
        v-for="wallet of wallets.wallets"
        :key="wallet.id"
        class="nt-clickable flex rounded-md bg-gray-100"
      >
        <RouterLink
          :to="`wallets/${wallet.id}`"
          class="nt-focus-ring w-0 grow truncate rounded-l-md p-4"
          >{{ wallet.name }}</RouterLink
        >
        <button
          class="material-icons nt-focus-ring p-4"
          @click="updateWallet(wallet)"
        >
          edit
        </button>
        <button
          class="material-icons nt-focus-ring rounded-r-md p-4"
          @click="deleteWallet(wallet)"
        >
          delete
        </button>
      </li>
      <li>
        <button
          class="nt-button w-full bg-emerald-800 capitalize"
          @click="createWallet()"
        >
          {{ $t('create.wallet') }}
        </button>
      </li>
    </ul>
    <Teleport to="body">
      <BaseModal
        :header="editedWallet ? 'Update Wallet' : 'Create Wallet'"
        :show="showModal"
        @close="showModal = false"
      >
        <div class="p-4">
          <WalletForm
            :wallet="editedWallet"
            @done="showModal = false"
          ></WalletForm>
        </div>
      </BaseModal>
    </Teleport>
  </main>
</template>

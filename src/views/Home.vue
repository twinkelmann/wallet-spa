<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '../components/BaseModal.vue'
import WalletForm from '../components/forms/WalletForm.vue'
import type { Ref } from 'vue'
import { type Wallet, deleteWallet, getAllWallets } from '@/models/wallet'
import LocaleSelector from '@/components/LocaleSelector.vue'
import { capitalizeFirstLetter, type RelDocument } from '@/models/common'
import { useI18n } from 'vue-i18n'
import { onMounted } from 'vue'

const { t } = useI18n()

const editedWallet: Ref<RelDocument<Wallet> | null> = ref(null)
const showModal = ref(false)

function createWallet() {
  editedWallet.value = null
  showModal.value = true
}

function updateWallet(wallet: RelDocument<Wallet>) {
  editedWallet.value = wallet
  showModal.value = true
}

async function onDeleteWallet(wallet: RelDocument<Wallet>) {
  if (confirm(capitalizeFirstLetter(`${t('delete.wallet')} ?`))) {
    try {
      await deleteWallet(wallet.id)
      allWallets.value = await getAllWallets()
    } catch (e) {
      // TODO: show errors to user
      console.error(e)
    }
  }
}

async function createUpdateDone() {
  try {
    allWallets.value = await getAllWallets()
  } catch (e) {
    // TODO: show errors to user
    console.error(e)
  }
  showModal.value = false
}

const allWallets: Ref<RelDocument<Wallet>[]> = ref([])

onMounted(async () => {
  try {
    allWallets.value = await getAllWallets()
  } catch (e) {
    // TODO: show errors to user
    console.error(e)
  }
})
</script>

<template>
  <main class="flex flex-col items-center">
    <h1 class="mb-4 mt-12 flex items-center text-3xl">
      <i class="material-icons mr-2">account_balance_wallet</i> Wallet
    </h1>
    <span class="mb-8 text-center">{{ $t('home.select-wallet') }}</span>
    <ul class="flex w-full flex-col gap-2 p-4 sm:w-2/3 md:w-1/2 lg:w-1/3">
      <li
        v-for="wallet of allWallets"
        :key="wallet.id"
        class="nt-clickable flex rounded-md bg-gray-100 shadow transition-shadow hover:shadow-md"
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
          @click="onDeleteWallet(wallet)"
        >
          delete
        </button>
      </li>
      <li>
        <button
          class="nt-button w-full bg-emerald-800 first-letter:uppercase"
          @click="createWallet()"
        >
          {{ $t('create.wallet') }}
        </button>
      </li>
    </ul>
    <div class="mb-4 mt-auto rounded-md bg-gray-100 p-4 shadow-md">
      <LocaleSelector></LocaleSelector>
    </div>
    <Teleport to="body">
      <BaseModal
        :header="editedWallet ? 'Update Wallet' : 'Create Wallet'"
        :show="showModal"
        @close="showModal = false"
      >
        <div class="p-4">
          <WalletForm
            :wallet="editedWallet"
            @done="createUpdateDone()"
          ></WalletForm>
        </div>
      </BaseModal>
    </Teleport>
  </main>
</template>

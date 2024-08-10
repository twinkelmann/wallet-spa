<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'
import AccountForm from '@/components/forms/AccountForm.vue'
import { DB } from '@/database/db'
import {
  deleteAccount,
  getAllAccountsOfWallet,
  type Account,
} from '@/models/account'
import {
  UPDATE_DATA_DEBOUNCE,
  capitalizeFirstLetter,
  type RelDocument,
} from '@/models/common'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/util'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { onBeforeUnmount } from 'vue'
import { watch } from 'vue'
import { onMounted } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const state = useStateStore()
const stateRefs = storeToRefs(state)
const { t } = useI18n()

const editedAccount: Ref<RelDocument<Account> | null> = ref(null)
const showModal = ref(false)
const accounts: Ref<RelDocument<Account>[]> = ref([])

function createAccount() {
  editedAccount.value = null
  showModal.value = true
}

function updateAccount(account: RelDocument<Account>) {
  editedAccount.value = account
  showModal.value = true
}

async function onDeleteAccount(account: RelDocument<Account>) {
  if (confirm(capitalizeFirstLetter(`${t('delete.account')} ?`))) {
    try {
      await deleteAccount(account.id)
    } catch (e) {
      // TODO: show errors to user
      console.error(e)
    }
  }
}

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['account'])

function updateData() {
  if (state.activeWallet) {
    getAllAccountsOfWallet(state.activeWallet.id).then((res) => {
      accounts.value = res
    })
  }
}
const debouncedUpdateData = debounce(updateData, UPDATE_DATA_DEBOUNCE)

watch(stateRefs.activeWallet, (current, previous) => {
  if (current && current.id !== previous?.id) {
    updateData()
  }
})

onMounted(() => {
  if (state.activeWallet) {
    updateData()
  }

  DB.then((db) => {
    changes = db
      .changes({
        since: 'now',
        live: true,
      })
      .on('change', (change) => {
        if (importantChanges.has(db.rel.parseDocID(change.id).type)) {
          debouncedUpdateData()
        }
      })
      .on('error', console.error)
  })
})

onBeforeUnmount(() => {
  if (changes) {
    changes.cancel()
  }
})
</script>

<template>
  <div class="mx-4 mb-4 flex flex-col items-center">
    <h1 class="text-center first-letter:uppercase">
      {{ $t('terminology.account', 2) }}
    </h1>
    <ul
      class="flex w-full flex-col gap-2 p-4 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2"
    >
      <li
        v-for="account of accounts"
        :key="account.id"
        class="nt-clickable flex rounded-md bg-gray-100"
      >
        <button
          class="nt-focus-ring flex w-0 grow items-center rounded-l-md p-4"
          @click="updateAccount(account)"
        >
          <span class="truncate"> {{ account.name }}</span>
          <i class="material-icons nt-focus-ring ml-auto">edit</i>
        </button>
        <button
          class="material-icons nt-focus-ring rounded-r-md p-4"
          @click="onDeleteAccount(account)"
        >
          delete
        </button>
      </li>
      <li>
        <button
          class="nt-button w-full bg-emerald-800 first-letter:uppercase"
          @click="createAccount()"
        >
          {{ $t('create.account') }}
        </button>
      </li>
    </ul>
    <Teleport to="body">
      <BaseModal
        :header="editedAccount ? $t('update.account') : $t('create.account')"
        :show="showModal"
        @close="showModal = false"
      >
        <div class="p-4" v-if="state.activeWallet">
          <AccountForm
            :wallet-id="state.activeWallet.id"
            :account="editedAccount"
            @done="showModal = false"
          ></AccountForm>
        </div>
      </BaseModal>
    </Teleport>
  </div>
</template>

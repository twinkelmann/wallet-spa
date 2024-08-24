<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'
import DebtItem from '@/components/DebtItem.vue'
import RecordList from '@/components/RecordList.vue'
import DebtForm from '@/components/forms/DebtForm.vue'
import DebtRecordForm from '@/components/forms/DebtRecordForm.vue'
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { getDebt, updateDebt, type Debt } from '@/models/debt'
import { getAllLabelsOfWallet, type Label } from '@/models/label'
import { getAllRecordsOfDebt, type Record } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { capitalizeFirstLetter, debounce } from '@/util'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

let id: string | null = null

const route = useRoute()
const router = useRouter()
const state = useStateStore()
const stateRefs = storeToRefs(state)
const { t } = useI18n()

const debt: Ref<RelDocument<Debt> | undefined> = ref(undefined)
const accounts: Ref<RelDocument<Account>[]> = ref([])
const categories: Ref<RelDocument<Category>[]> = ref([])
const records: Ref<RelDocument<Record>[]> = ref([])
const labels: Ref<RelDocument<Label>[]> = ref([])
const showDebtModal = ref(false)
const showRecordModal = ref(false)

const orderedRecords = computed(() =>
  records.value.sort((a, b) => b.datetime - a.datetime)
)

async function toggleCloseDebt() {
  if (!debt.value) {
    return
  }
  if (
    confirm(
      capitalizeFirstLetter(
        `${t(debt.value.closed ? 'debt.reopen' : debt.value.balance > 0 ? 'debt.ignore' : 'debt.forgive')} ?`
      )
    )
  ) {
    try {
      await updateDebt(
        debt.value.id,
        debt.value.balance,
        debt.value.payee,
        debt.value.description,
        !debt.value.closed
      )
    } catch (e) {
      alert(e)
      console.error(e)
    }
  }
}

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set([
  'account',
  'category',
  'record',
  'label',
  'debt',
])

async function updateData() {
  if (state.activeWallet && id) {
    debt.value = await getDebt(id)
    if (!debt.value) {
      // If the debt is not found, redirect to debts page
      return router.replace(`/wallets/${state.activeWallet}/debts`)
    }

    getAllAccountsOfWallet(state.activeWallet)
      .then((res) => (accounts.value = res))
      .then(() => getAllRecordsOfDebt(id || ''))
      .then((res) => (records.value = res))
      .catch(console.error)
    getAllCategoriesOfWallet(state.activeWallet)
      .then((res) => (categories.value = res))
      .catch(console.error)
    getAllLabelsOfWallet(state.activeWallet)
      .then((res) => (labels.value = res))
      .catch(console.error)
  }
}
const debouncedUpdateData = debounce(updateData, UPDATE_DATA_DEBOUNCE)

watch(stateRefs.activeWallet, (current, previous) => {
  if (current && current !== previous) {
    updateData()
  }
})

onMounted(async () => {
  // Try to auto-select debt based on URL
  id = Array.isArray(route.params.debtId)
    ? route.params.debtId[0]
    : route.params.debtId

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
    <h2
      class="text-center text-lg font-medium first-letter:uppercase"
      v-if="debt"
    >
      {{ $t('terminology.debt') }} ({{
        $t(
          debt.closed
            ? 'debt.closed'
            : debt.balance > 0
              ? 'debt.borrowed'
              : 'debt.lent'
        )
      }})
    </h2>
    <DebtItem
      class="mb-6 w-full lg:w-2/3 2xl:w-1/2"
      v-if="debt"
      :debt="debt"
    ></DebtItem>
    <RecordList
      class="m-2 mb-24 w-full lg:mb-0 lg:w-2/3 2xl:w-1/2"
      :accounts="accounts"
      :categories="categories"
      :labels="labels"
      :records="orderedRecords"
    ></RecordList>
    <div class="fixed bottom-8 right-8 flex gap-4">
      <button
        class="nt-icon-button wallet-primary print:hidden"
        @click="showRecordModal = true"
      >
        add
      </button>
      <button
        class="nt-icon-button wallet-secondary print:hidden"
        @click="showDebtModal = true"
      >
        edit
      </button>
      <button
        class="nt-icon-button wallet-secondary print:hidden"
        @click="toggleCloseDebt()"
        :disabled="debt?.closed && debt?.balance === 0"
      >
        {{ debt?.closed ? 'folder_open' : 'folder_zip' }}
      </button>
    </div>
    <Teleport to="body">
      <!-- update debt form -->
      <BaseModal
        :header="$t('update.debt')"
        :show="showDebtModal"
        @close="showDebtModal = false"
      >
        <div class="p-4" v-if="state.activeWallet">
          <DebtForm
            :wallet-id="state.activeWallet"
            :debt="debt"
            :accounts="accounts"
            :categories="categories"
            :labels="labels"
            @done="showDebtModal = false"
          ></DebtForm>
        </div>
      </BaseModal>
      <!-- create record form -->
      <BaseModal
        :header="$t('create.record')"
        :show="showRecordModal"
        @close="showRecordModal = false"
      >
        <div class="p-4" v-if="debt">
          <DebtRecordForm
            :debt="debt"
            :accounts="accounts"
            :categories="categories"
            :labels="labels"
            @done="showRecordModal = false"
          ></DebtRecordForm>
        </div>
      </BaseModal>
    </Teleport>
  </div>
</template>

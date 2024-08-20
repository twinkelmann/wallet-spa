<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'
import DebtList from '@/components/DebtList.vue'
import DebtForm from '@/components/forms/DebtForm.vue'
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { getAllDebtsOfWallet, updateDebt, type Debt } from '@/models/debt'
import { getAllLabelsOfWallet, type Label } from '@/models/label'
import { useStateStore } from '@/stores/state'
import { capitalizeFirstLetter, debounce } from '@/util'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { computed } from 'vue'
import { onBeforeUnmount } from 'vue'
import { watch } from 'vue'
import { onMounted } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const state = useStateStore()
const stateRefs = storeToRefs(state)
const { t } = useI18n()

const editedDebt: Ref<RelDocument<Debt> | null> = ref(null)
const showModal = ref(false)
const accounts: Ref<RelDocument<Account>[]> = ref([])
const categories: Ref<RelDocument<Category>[]> = ref([])
const labels: Ref<RelDocument<Label>[]> = ref([])
const debts: Ref<RelDocument<Debt>[]> = ref([])

const orderByCreated = (a: Debt, b: Debt) => a.createdAt - b.createdAt

const sorted = computed(() => debts.value.sort(orderByCreated))
const lent = computed(() => sorted.value.filter((d) => d.balance < 0))
const borrowed = computed(() => sorted.value.filter((d) => d.balance > 0))
const closed = computed(() =>
  sorted.value.filter((d) => d.closed || d.balance === 0)
)

function createDebt() {
  editedDebt.value = null
  showModal.value = true
}

function onUpdateDebt(debt: RelDocument<Debt>) {
  editedDebt.value = debt
  showModal.value = true
}

async function onCloseDebt(debt: RelDocument<Debt>) {
  if (
    confirm(
      capitalizeFirstLetter(
        `${t(debt.balance > 0 ? 'debt.ignore' : 'debt.forgive')} ?`
      )
    )
  ) {
    try {
      await updateDebt(
        debt.id,
        debt.balance,
        debt.payee,
        debt.description,
        true
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
  'label',
  'debt',
  'record',
])

function updateData() {
  if (state.activeWallet) {
    getAllAccountsOfWallet(state.activeWallet)
      .then((res) => (accounts.value = res))
      .catch(console.error)
    getAllCategoriesOfWallet(state.activeWallet)
      .then((res) => (categories.value = res))
      .catch(console.error)
    getAllLabelsOfWallet(state.activeWallet)
      .then((res) => (labels.value = res))
      .catch(console.error)
    getAllDebtsOfWallet(state.activeWallet)
      .then((res) => (debts.value = res))
      .catch(console.error)
  }
}
const debouncedUpdateData = debounce(updateData, UPDATE_DATA_DEBOUNCE)

watch(stateRefs.activeWallet, (current, previous) => {
  if (current && current !== previous) {
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
    <h2 class="text-center text-lg font-medium first-letter:uppercase">
      {{ $t('terminology.debt', 2) }}
    </h2>
    <h3
      class="mt-4 font-medium text-red-700 dark:text-red-400"
      v-if="lent.length"
    >
      {{ $t('debt.lent') }}
    </h3>
    <DebtList
      v-if="lent.length"
      :debts="lent"
      @update="onUpdateDebt($event)"
      @close="onCloseDebt($event)"
    ></DebtList>
    <h3
      class="mt-4 font-medium text-green-700 dark:text-green-400"
      v-if="borrowed.length"
    >
      {{ $t('debt.borrowed') }}
    </h3>
    <DebtList
      v-if="borrowed.length"
      :debts="borrowed"
      @update="onUpdateDebt($event)"
      @close="onCloseDebt($event)"
    ></DebtList>
    <h3 class="mt-4 font-medium" v-if="closed.length">
      {{ $t('debt.closed') }}
    </h3>
    <DebtList
      v-if="closed.length"
      :debts="closed"
      @update="onUpdateDebt($event)"
      @close="onCloseDebt($event)"
    ></DebtList>
    <div class="mt-4 flex w-full px-4 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2">
      <button
        class="nt-button wallet-primary w-full first-letter:uppercase"
        @click="createDebt()"
      >
        {{ $t('create.debt') }}
      </button>
    </div>
    <Teleport to="body">
      <BaseModal
        :header="editedDebt ? $t('update.debt') : $t('create.debt')"
        :show="showModal"
        @close="showModal = false"
      >
        <div class="p-4" v-if="state.activeWallet">
          <DebtForm
            :wallet-id="state.activeWallet"
            :debt="editedDebt"
            :accounts="accounts"
            :categories="categories"
            :labels="labels"
            @done="showModal = false"
          ></DebtForm>
        </div>
      </BaseModal>
    </Teleport>
  </div>
</template>

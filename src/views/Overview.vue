<script setup lang="ts">
import CreateRecord from '@/components/CreateRecord.vue'
import AccountsWidget from '@/components/widgets/AccountsWidget.vue'
import RecordsWidget from '@/components/widgets/RecordsWidget.vue'
import TotalWidget from '@/components/widgets/TotalWidget.vue'
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { getAllLabelsOfWallet, type Label } from '@/models/label'
import type { Record } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/util'
import { storeToRefs } from 'pinia'
import { watch, onMounted, onBeforeUnmount, ref, type Ref } from 'vue'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const accounts: Ref<RelDocument<Account>[]> = ref([])
const categories: Ref<RelDocument<Category>[]> = ref([])
const labels: Ref<RelDocument<Label>[]> = ref([])

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['account', 'record', 'label'])

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
  <TotalWidget :accounts="accounts"></TotalWidget>
  <AccountsWidget :accounts="accounts"></AccountsWidget>
  <RecordsWidget
    :accounts="accounts"
    :categories="categories"
    :labels="labels"
  ></RecordsWidget>
  <CreateRecord
    :accounts="accounts"
    :categories="categories"
    :labels="labels"
  ></CreateRecord>
</template>

<script setup lang="ts">
import CreateRecord from '@/components/CreateRecord.vue'
import AccountsWidget from '@/components/widgets/AccountsWidget.vue'
import RecordsWidget from '@/components/widgets/RecordsWidget.vue'
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { getAllLabelsOfWallet, type Label } from '@/models/label'
import type { Record } from '@/models/record'
import { getAllRecordsOfAccount } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/util'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { watch, onMounted, onBeforeUnmount, ref, type Ref } from 'vue'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const accounts: Ref<RelDocument<Account>[]> = ref([])
const categories: Ref<RelDocument<Category>[]> = ref([])
const records: Ref<RelDocument<Record>[]> = ref([])
const labels: Ref<RelDocument<Label>[]> = ref([])

const visibleRecords = computed(() => {
  if (state.shownAccounts.size === 0) {
    return records.value
  }
  return records.value.filter((r) => state.shownAccounts.has(r.accountId))
})

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['account', 'record', 'label'])

function updateData() {
  if (state.activeWallet) {
    getAllAccountsOfWallet(state.activeWallet.id)
      .then((res) => {
        accounts.value = res
        return Promise.all(res.map((a) => getAllRecordsOfAccount(a.id)))
      })
      .then((res) => {
        records.value = ([] as RelDocument<Record>[]).concat(...res)
      })
      .catch(console.error)
    getAllCategoriesOfWallet(state.activeWallet.id)
      .then((res) => (categories.value = res))
      .catch(console.error)
    getAllLabelsOfWallet(state.activeWallet.id)
      .then((res) => (labels.value = res))
      .catch(console.error)
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
  <AccountsWidget :accounts="accounts"></AccountsWidget>
  <RecordsWidget
    :accounts="accounts"
    :categories="categories"
    :labels="labels"
    :records="visibleRecords"
  ></RecordsWidget>
  <CreateRecord
    :accounts="accounts"
    :categories="categories"
    :labels="labels"
  ></CreateRecord>
</template>

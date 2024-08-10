<script setup lang="ts">
import CreateRecord from '@/components/CreateRecord.vue'
import RecordList from '@/components/RecordList.vue'
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { getAllLabelsOfWallet, type Label } from '@/models/label'
import { getAllRecordsOfAccount, type Record } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/util'
import { DateTime } from 'luxon'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const accounts: Ref<RelDocument<Account>[]> = ref([])
const records: Ref<RelDocument<Record>[]> = ref([])
const labels: Ref<RelDocument<Label>[]> = ref([])

const orderedRecords = computed(() => {
  const recordsWithDates = records.value.map((r) => ({
    ...r,
    compare: DateTime.fromISO(r.datetime),
  }))
  return recordsWithDates
    .sort((a, b) => b.compare.valueOf() - a.compare.valueOf())
    .map((r) => ({ ...r, compare: undefined }))
})

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['record'])

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
  <div class="mx-4 mb-4 flex flex-col items-center">
    <h1 class="text-center first-letter:uppercase">
      {{ $t('terminology.record', 2) }}
    </h1>
    <RecordList
      class="m-2 mb-24 w-full lg:mb-0 lg:w-2/3 2xl:w-1/2"
      :accounts="accounts"
      :labels="labels"
      :records="orderedRecords"
    ></RecordList>
    <CreateRecord :accounts="accounts" :labels="labels"></CreateRecord>
  </div>
</template>

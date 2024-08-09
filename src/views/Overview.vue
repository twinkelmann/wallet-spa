<script setup lang="ts">
import CreateRecord from '@/components/CreateRecord.vue'
import AccountsWidget from '@/components/widgets/AccountsWidget.vue'
import RecordsWidget from '@/components/widgets/RecordsWidget.vue'
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import type { RelDocument } from '@/models/common'
import type { Record } from '@/models/record'
import { getAllRecordsOfAccount } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { storeToRefs } from 'pinia'
import { watch, onMounted, onBeforeUnmount, ref, type Ref } from 'vue'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const accounts: Ref<RelDocument<Account>[]> = ref([])
const records: Ref<RelDocument<Record>[]> = ref([])

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['account', 'record'])

// TODO: try not to do multiple updates at the same time
// aka debounce db changes
function updateData() {
  if (state.activeWallet) {
    getAllAccountsOfWallet(state.activeWallet.id)
      .then((res) => {
        accounts.value = res
        console.log('accounts', res)
        return Promise.all(res.map((a) => getAllRecordsOfAccount(a.id)))
      })
      .then((res) => {
        console.log('records', res)
        records.value = ([] as RelDocument<Record>[]).concat(...res)
        console.log('combined records', records.value)
      })
  }
}

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
          updateData()
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
  <RecordsWidget :accounts="accounts" :records="records"></RecordsWidget>
  <CreateRecord :accounts="accounts"></CreateRecord>
</template>

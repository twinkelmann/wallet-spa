<script setup lang="ts">
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { getAllLabelsOfWallet, type Label } from '@/models/label'
import type { Planned } from '@/models/planned'
import { getAllPlannedsOfAccounts } from '@/models/planned'
import { useStateStore } from '@/stores/state'
import { debounce } from '@/util'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { onBeforeUnmount } from 'vue'
import { watch } from 'vue'
import { onMounted } from 'vue'
import { ref } from 'vue'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const accounts: Ref<RelDocument<Account>[]> = ref([])
const categories: Ref<RelDocument<Category>[]> = ref([])
const labels: Ref<RelDocument<Label>[]> = ref([])
const planneds: Ref<RelDocument<Planned>[]> = ref([])

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set([
  'account',
  'category',
  'label',
  'record',
  'planned',
])

function updateData() {
  if (state.activeWallet) {
    getAllAccountsOfWallet(state.activeWallet)
      .then((res) => {
        accounts.value = res
        return getAllPlannedsOfAccounts(res.map((a) => a.id))
      })
      .then((res) => {
        planneds.value = res
      })
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
  <div class="mx-4 mb-4 flex flex-col items-center">
    <h2 class="text-center text-lg font-medium first-letter:uppercase">
      {{ $t('terminology.planned', 2) }}
    </h2>
    <ul>
      <li v-for="planned of planneds" :key="planned.id">
        {{ planned.description }}
      </li>
    </ul>
  </div>
</template>

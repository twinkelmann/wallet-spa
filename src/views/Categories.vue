<script setup lang="ts">
import CategoriesList from '@/components/CategoriesList.vue'
import { DB } from '@/database/db'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
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

const categories: Ref<RelDocument<Category>[]> = ref([])

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['category'])

function updateData() {
  if (state.activeWallet) {
    getAllCategoriesOfWallet(state.activeWallet).then((res) => {
      categories.value = res
    })
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
      {{ $t('terminology.category', 2) }}
    </h2>
    <ul
      class="flex w-full flex-col gap-2 p-4 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2"
    >
      <CategoriesList :categories="categories"></CategoriesList>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { DB } from '@/database/db'
import {
  getAllCategoriesOfWallet,
  type Category,
  insertDefaultCategoryTree,
} from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { useStateStore } from '@/stores/state'
import { debounce, useBlackText } from '@/util'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { onBeforeUnmount } from 'vue'
import { computed } from 'vue'
import { watch } from 'vue'
import { onMounted } from 'vue'
import { ref } from 'vue'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const categories: Ref<RelDocument<Category>[]> = ref([])

const categoriesAsTree = computed(() => {
  // find root categories
  const roots = categories.value.filter((c) => !c.categoryId)
  const withChildren = roots.map((c) => {
    const children = categories.value
      .filter((cx) => cx.categoryId === c.id)
      .sort((a, b) => a.name.localeCompare(b.name))
    // we cannot know the depth of the tree... need to like remove the used categories, and stop when the list is empty
    return { ...c, children }
  })
  return withChildren.sort((a, b) => a.name.localeCompare(b.name))
})

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['category'])

function updateData() {
  if (state.activeWallet) {
    getAllCategoriesOfWallet(state.activeWallet.id).then((res) => {
      categories.value = res
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
      {{ $t('terminology.category', 2) }}
    </h1>
    <ul
      class="flex w-full flex-col gap-2 p-4 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2"
    >
      <li
        v-for="category of categoriesAsTree"
        :key="category.id"
        :style="`background-color: ${category.color}`"
        :class="`flex flex-col overflow-hidden rounded-md ${useBlackText(category.color) ? 'text-black' : 'text-white'}`"
      >
        <div class="flex items-center">
          <i class="material-icons p-4">{{ category.icon }}</i>
          <span>{{ category.name }}</span>
        </div>
        <div
          class="ml-4 flex items-center"
          v-for="child of category.children"
          :key="child.id"
          :style="`background-color: ${child.color}`"
        >
          <i class="material-icons p-4">{{ child.icon }}</i>
          <span>{{ child.name }}</span>
        </div>
      </li>
    </ul>
  </div>
  <button
    v-if="state.activeWallet && categories.length === 0"
    class="nt-button m-4 shrink-0 bg-red-900 print:hidden"
    @click="
      insertDefaultCategoryTree(state.activeWallet.id).catch(console.error)
    "
  >
    Import Default Categories
  </button>
</template>

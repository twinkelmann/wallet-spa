<script setup lang="ts">
import type { Category } from '@/models/category'
import type { ID, RelDocument } from '@/models/common'
import { useBlackText } from '@/util'
import { computed } from 'vue'

const props = defineProps<{
  categories: RelDocument<Category>[]
  enableSelection?: boolean
}>()

const emit = defineEmits<{ (e: 'selected', categoryId: ID): void }>()

const categoriesAsTree = computed(() => {
  // find root categories
  const roots = props.categories.filter((c) => !c.categoryId)
  const withChildren = roots.map((c) => {
    const children = props.categories
      .filter((cx) => cx.categoryId === c.id)
      .sort((a, b) => a.name.localeCompare(b.name))
    // TODO: handle arbitrary category depth
    // we cannot know the depth of the tree... need to like remove the used categories, and stop when the list is empty
    return { ...c, children }
  })
  return withChildren.sort((a, b) => a.name.localeCompare(b.name))
})

function onClick(categoryId: ID) {
  if (props.enableSelection) {
    emit('selected', categoryId)
  }
}
</script>

<template>
  <li
    v-for="category of categoriesAsTree"
    :key="category.id"
    :style="`background-color: ${category.color}`"
    :class="`flex flex-col overflow-hidden rounded-md ${useBlackText(category.color) ? 'text-black' : 'text-white'}`"
  >
    <div
      :class="`mr-4 flex items-center ${enableSelection ? 'cursor-pointer' : ''}`"
      @click="onClick(category.id)"
    >
      <i class="material-icons p-4">{{ category.icon }}</i>
      <span>{{ category.name }}</span>
    </div>
    <div
      :class="`ml-4 mr-8 flex items-center ${enableSelection ? 'cursor-pointer' : ''}`"
      v-for="child of category.children"
      :key="child.id"
      :style="`background-color: ${child.color}`"
      @click="onClick(child.id)"
    >
      <i class="material-icons p-4">{{ child.icon }}</i>
      <span>{{ child.name }}</span>
    </div>
  </li>
</template>

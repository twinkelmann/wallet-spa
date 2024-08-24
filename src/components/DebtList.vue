<script setup lang="ts">
import type { RelDocument } from '@/models/common'
import type { Debt } from '@/models/debt'
import DebtItem from './DebtItem.vue'

defineProps<{
  debts: RelDocument<Debt>[]
}>()
</script>

<template>
  <ul
    class="flex w-full flex-col gap-2 p-2 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2"
  >
    <li v-for="debt of debts" :key="debt.id">
      <RouterLink
        :to="`debts/${debt.id}`"
        class="nt-clickable nt-focus-ring w-full text-left"
      >
        <DebtItem :debt="debt"></DebtItem>
      </RouterLink>
    </li>
  </ul>
</template>

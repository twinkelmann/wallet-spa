<script setup lang="ts">
import type { RelDocument } from '@/models/common'
import type { Debt } from '@/models/debt'
import DebtItem from './DebtItem.vue'

defineProps<{
  debts: RelDocument<Debt>[]
}>()
defineEmits<{
  (e: 'update', d: RelDocument<Debt>): void
  (e: 'close', d: RelDocument<Debt>): void
  (e: 'add', d: RelDocument<Debt>): void
}>()
</script>

<template>
  <ul
    class="flex w-full flex-col gap-2 p-4 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2"
  >
    <li
      class="border-b border-gray-100 last:border-none"
      v-for="debt of debts"
      :key="debt.id"
    >
      <button
        class="nt-clickable nt-focus-ring w-full text-left"
        @click="$emit('update', debt)"
      >
        <DebtItem :debt="debt"></DebtItem>
      </button>
      <button
        class="nt-button bg-wallet-secondary mt-2 w-full px-4 first-letter:uppercase md:w-auto"
        @click="$emit('add', debt)"
      >
        {{ $t('create.record') }}
      </button>
    </li>
  </ul>
</template>

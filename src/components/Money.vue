<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

defineProps<{
  amount: number
  currency?: string
}>()

const settings = useSettingsStore()
</script>
<template>
  <span
    :class="`font-medium ${amount >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`"
  >
    {{
      amount.toLocaleString(settings.numberLocale, {
        style: 'currency',
        currency: currency ?? 'CHF',
      })
    }}</span
  >
</template>

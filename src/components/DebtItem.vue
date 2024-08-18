<script setup lang="ts">
import type { RelDocument } from '@/models/common'
import type { Debt } from '@/models/debt'
import { useSettingsStore } from '@/stores/settings'
import { DateTime } from 'luxon'

const settings = useSettingsStore()

defineProps<{
  debt: RelDocument<Debt>
}>()
</script>
<template>
  <div class="flex w-full gap-4">
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-300"
    >
      <i class="material-icons text-gray-700">person</i>
    </div>
    <div class="flex grow flex-col">
      <span class="font-medium uppercase">{{
        $t(debt.balance > 0 ? 'debt.i-owe' : 'debt.owes-me', {
          payee: debt.payee,
        })
      }}</span>
      <span class="italic" v-if="debt.description"
        >"{{ debt.description }}"</span
      >
    </div>
    <div class="flex shrink-0 flex-col text-right">
      <span>
        {{
          Math.abs(debt.balance).toLocaleString(settings.numberLocale, {
            style: 'currency',
            // TODO: handle the fact that there could be multiple currencies
            currency: 'CHF',
          })
        }}</span
      >
      <span class="text-sm">{{
        DateTime.fromMillis(debt.createdAt)
          .reconfigure({ locale: $i18n.locale })
          .toLocaleString({
            month: 'short',
            day: 'numeric',
            // TODO: don't show the year if current year
            year: 'numeric',
          })
      }}</span>
    </div>
  </div>
</template>

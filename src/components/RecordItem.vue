<script setup lang="ts">
import type { Account } from '@/models/account'
import type { RelDocument } from '@/models/common'
import type { Record } from '@/models/record'
import { useSettingsStore } from '@/stores/settings'
import { DateTime } from 'luxon'
import { computed } from 'vue'

const settings = useSettingsStore()

const props = defineProps<{
  record: RelDocument<Record>
  account: Account
}>()
const desc = computed(() => {
  return [props.record.description, props.record.payee]
    .filter(Boolean)
    .join(' - ')
})
</script>
<template>
  <div class="flex w-full gap-2">
    <!-- TODO: category -->
    <div class="h-10 w-10 shrink-0 rounded-full bg-gray-400"></div>
    <div class="flex grow flex-col">
      <span class="font-medium">Category Name</span>
      <span>{{ account.name }}</span>
      <span class="italic" v-if="desc">"{{ desc }}"</span>
      <!-- TODO: labels -->
      <ul class="flex flex-wrap">
        <li class="rounded-md bg-gray-400 p-2 text-sm">Label</li>
      </ul>
    </div>
    <div class="flex shrink-0 flex-col text-right">
      <span
        :class="`font-medium ${record.value >= 0 ? 'text-green-700' : 'text-red-700'}`"
      >
        {{
          record.value.toLocaleString(settings.numberLocale, {
            style: 'currency',
            currency: account.currency,
          })
        }}</span
      >
      <!-- TODO maybe: intermediary value -->
      <span class="text-sm">{{
        DateTime.fromISO(record.datetime)
          .reconfigure({ locale: $i18n.locale })
          .toLocaleString({
            month: 'short',
            day: 'numeric',
          })
      }}</span>
    </div>
  </div>
</template>

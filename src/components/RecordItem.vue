<script setup lang="ts">
import type { Record } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { DateTime } from 'luxon'
import { computed } from 'vue'

const state = useStateStore()

const { record } = defineProps<{ record: Record }>()
const desc = computed(() => {
  return [record.description, record.payee].filter(Boolean).join(' - ')
})

// TODO: use configured local
const languages = navigator.languages
</script>
<template>
  <div class="flex w-full gap-2">
    <!-- TODO: category -->
    <div class="h-10 w-10 shrink-0 rounded-full bg-gray-400"></div>
    <div class="flex grow flex-col">
      <span class="font-medium">Category Name</span>
      <span>{{ state.accountById[record.accountId].name }}</span>
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
          record.value.toLocaleString(languages, {
            style: 'currency',
            currency: state.accountById[record.accountId].currency.code,
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

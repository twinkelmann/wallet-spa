<script setup lang="ts">
import CreateRecord from '@/components/CreateRecord.vue'
import RecordList from '@/components/RecordList.vue'
import type { Record } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { DateTime } from 'luxon'
import { computed } from 'vue'

const state = useStateStore()

const orderedRecords = computed(() => {
  const recordsWithDates = state.activeRecords.map((r) => ({
    ...r,
    datetime: DateTime.fromISO(r.datetime),
  }))
  return recordsWithDates
    .sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
    .map((r) => ({ ...r, datetime: r.datetime.toISO() || '' }))
})
</script>

<template>
  <div class="mx-4 mb-4 flex flex-col items-center">
    <h1 class="text-center first-letter:uppercase">
      {{ $t('terminology.record', 2) }}
    </h1>
    <RecordList
      class="m-2 mb-24 w-full lg:mb-0 lg:w-2/3 2xl:w-1/2"
      :records="orderedRecords"
    ></RecordList>
    <CreateRecord></CreateRecord>
  </div>
</template>

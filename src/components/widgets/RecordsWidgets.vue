<script setup lang="ts">
import { useWalletsStore } from '@/stores/wallets'
import { computed } from 'vue'
import { useStateStore } from '@/stores/state'
import { DateTime, Duration } from 'luxon'
import type { Record } from '@/models/record'
import RecordList from '../RecordList.vue'

const state = useStateStore()
const wallets = useWalletsStore()

// TODO: allow modifying and saving filter
const filter = Duration.fromObject({ day: 30 })
const filterDate = DateTime.now().minus(filter)

const orderedRecords = computed(() => {
  const recordsWithDates = state.activeRecords.map((r) => ({
    ...r,
    datetime: DateTime.fromISO(r.datetime),
  }))
  return recordsWithDates
    .filter((r) => r.datetime >= filterDate)
    .sort((a, b) => b.datetime.valueOf() - a.datetime.valueOf())
    .map((r) => ({ ...r, datetime: r.datetime.toISO() || '' }))
})

// TODO: remove test features below

function choose<T>(array: T[]): T {
  const index = Math.random() * array.length
  return array[Math.floor(index)]
}

const lorem =
  'Minima recusandae minus repudiandae maiores Assumenda omnis nobis facere perspiciatis Hic sint asperiores adipisci quaerat quia Tenetur aut qui dolor aut aut numquam distinctio Laborum consequatur saepe consequatur voluptas magni Aut atque et eligendi ducimus distinctio quo'.split(
    ' '
  )
function randomText() {
  return new Array(Math.floor(Math.random() * 7) + 3)
    .fill('')
    .map(() => choose(lorem))
    .join(' ')
}

function randomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
}

function addTestData() {
  if (state.activeWallet) {
    for (let i = 0; i < 250; i++) {
      wallets.createRecord(
        choose(state.activeAccounts).id,
        +(Math.random() * 1000 - 500).toFixed(2),
        null,
        randomText(),
        randomDate(new Date(2022, 0, 1), new Date()).toISOString()
      )
    }
  }
}
function deleteAll() {
  state.activeRecords.forEach((r) => wallets.deleteRecord(r.id))
}
</script>

<template>
  <div class="mx-4 flex items-center justify-between">
    <h2 class="text-lg font-medium">
      Last records overview ({{ filter.toHuman() }})
    </h2>
    <button class="material-icons nt-focus-ring rounded-full p-4">
      settings
    </button>
  </div>
  <RecordList class="m-2" :records="orderedRecords"></RecordList>
  <button class="nt-button m-4 shrink-0 bg-red-900" @click="addTestData()">
    Add test data
  </button>
  <button class="nt-button m-4 shrink-0 bg-red-900" @click="deleteAll()">
    Delete all records in active Wallet
  </button>
</template>

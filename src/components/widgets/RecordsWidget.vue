<script setup lang="ts">
import { computed } from 'vue'
import { DateTime, Duration } from 'luxon'
import { createRecord, deleteRecord, type Record } from '@/models/record'
import RecordList from '../RecordList.vue'
import type { ID, RelDocument } from '@/models/common'
import type { Account } from '@/models/account'
import { useStateStore } from '@/stores/state'
import { watch } from 'vue'
import type { Label } from '@/models/label'

const state = useStateStore()

const props = defineProps<{
  accounts: RelDocument<Account>[]
  labels: RelDocument<Label>[]
  records: RelDocument<Record>[]
}>()

watch(props.records, (current, previous) => {
  console.log(current?.length, previous?.length)
})

// TODO: allow modifying and saving filter
// TODO: only query the relevant data from the DB
const filter = Duration.fromObject({ day: 30 })
const filterDate = DateTime.now().minus(filter)

const orderedRecords = computed(() => {
  const recordsWithDates = props.records.map((r) => ({
    ...r,
    compare: DateTime.fromISO(r.datetime),
  }))
  return recordsWithDates
    .filter((r) => r.compare >= filterDate)
    .sort((a, b) => b.compare.valueOf() - a.compare.valueOf())
    .map((r) => ({ ...r, compare: undefined }))
})

// TODO: remove test features below

function choose<T>(array: T[]): T {
  const index = Math.random() * array.length
  return array[Math.floor(index)]
}
function chooseMany<T>(array: T[], amount: number): T[] {
  const possibilities = [...array]
  const results: T[] = new Array(amount)
  for (let i = 0; i < amount; ++i) {
    const index = Math.random() * possibilities.length
    results[i] = possibilities.splice(Math.floor(index), 1)[0]
  }
  return results
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

async function addTestData() {
  if (state.activeWallet) {
    try {
      for (let i = 0; i < 100; i++) {
        console.log(i)
        await createRecord(
          choose(props.accounts).id,
          chooseMany(
            props.labels,
            Math.round(Math.random() * props.labels.length)
          ).map((x) => x.id),
          +(Math.random() * 1000 - 500).toFixed(2),
          null,
          randomText(),
          randomDate(new Date(2022, 0, 1), new Date()).toISOString()
        )
      }
    } catch (e) {
      console.error(e)
    }
  }
}
async function deleteAll() {
  try {
    for (const r of props.records) {
      await deleteRecord(r.id)
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div class="mx-4 flex items-center justify-between">
    <h2 class="text-lg font-medium">
      {{ $t('widgets.records.title', 2) }} ({{
        filter.reconfigure({ locale: $i18n.locale }).toHuman()
      }})
    </h2>
    <button class="material-icons nt-focus-ring rounded-full p-4 print:hidden">
      settings
    </button>
  </div>
  <RecordList
    class="m-2"
    :accounts="accounts"
    :labels="labels"
    :records="orderedRecords"
  ></RecordList>
  <button
    class="nt-button m-4 shrink-0 bg-red-900 print:hidden"
    @click="addTestData()"
  >
    Add test data
  </button>
  <button
    class="nt-button m-4 shrink-0 bg-red-900 print:hidden"
    @click="deleteAll()"
  >
    Delete all records in active Wallet
  </button>
</template>

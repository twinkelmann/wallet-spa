<script setup lang="ts">
import { DateTime, Duration } from 'luxon'
import {
  createRecord,
  getAllRecordsOfAccountsByDate,
  type Record,
} from '@/models/record'
import RecordList from '../RecordList.vue'
import {
  UPDATE_DATA_DEBOUNCE,
  type ID,
  type RelDocument,
} from '@/models/common'
import type { Account } from '@/models/account'
import { useStateStore } from '@/stores/state'
import { watch } from 'vue'
import type { Label } from '@/models/label'
import type { Category } from '@/models/category'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { debounce, updateMonthlies, updateBalance } from '@/util'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { DB } from '@/database/db'
import { onBeforeUnmount } from 'vue'
import { getAllRecordsOfAccount } from '@/models/record'
import { deleteRecord } from '@/models/record'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const props = defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
}>()

const records: Ref<RelDocument<Record>[]> = ref([])

const filters = [
  { days: 7 },
  { days: 30 },
  { weeks: 12 },
  { months: 6 },
  { years: 1 },
  { years: 5 },
].map((x) => Duration.fromObject(x))

const filter = defineModel({ default: 1 })

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['record'])

function updateData() {
  if (state.activeWallet) {
    let accounts: ID[]
    if (state.shownAccounts.size === 0) {
      accounts = props.accounts.map((a) => a.id)
    } else {
      accounts = [...state.shownAccounts]
    }
    const now = DateTime.now()
    const filterDate = DateTime.now().minus(filters[filter.value]).toMillis()

    getAllRecordsOfAccountsByDate(
      accounts,
      filterDate,
      now.toMillis(),
      null,
      true,
      true,
      false
    )
      .then((res) => (records.value = res))
      .catch(console.error)
  }
}
const debouncedUpdateData = debounce(updateData, UPDATE_DATA_DEBOUNCE)

watch(stateRefs.activeWallet, (current, previous) => {
  if (current && current !== previous) {
    updateData()
  }
})

watch(
  () => props.accounts,
  (current, previous) => {
    if (current.length > 0 && current.length !== previous.length) {
      updateData()
    }
  }
)
watch(
  () => state.shownAccounts.size,

  updateData
)
watch(filter, updateData)

onMounted(() => {
  if (state.activeWallet) {
    updateData()
  }

  DB.then((db) => {
    changes = db
      .changes({
        since: 'now',
        live: true,
      })
      .on('change', (change) => {
        if (importantChanges.has(db.rel.parseDocID(change.id).type)) {
          debouncedUpdateData()
        }
      })
      .on('error', console.error)
  })
})

onBeforeUnmount(() => {
  if (changes) {
    changes.cancel()
  }
})

// TODO: remove test features below

function choose<T>(array: T[]): T {
  const index = Math.random() * array.length
  return array[Math.floor(index)]
}
function chooseMany<T>(array: T[], amount: number): T[] {
  const possibilities = [...array]
  if (amount >= array.length) {
    return possibilities
  }
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
      const oldest: { [x: ID]: number } = {}
      for (let i = 0; i < 100; i++) {
        console.log(i)
        const accountId = choose(props.accounts).id
        const datetime = randomDate(new Date(2022, 0, 1), new Date()).valueOf()
        if (!oldest[accountId] || datetime < oldest[accountId]) {
          oldest[accountId] = datetime
        }
        await createRecord(
          accountId,
          choose(props.categories).id,
          chooseMany(
            props.labels,
            Math.round(Math.random() * props.labels.length)
          ).map((x) => x.id),
          +(Math.random() * 1000 - 500).toFixed(2),
          null,
          randomText(),
          datetime,
          // don't recompute monthlies to gain some perf
          false
        )
      }
      // update monthlies only once per account, manually
      for (const id in oldest) {
        await updateMonthlies(id, oldest[id])
        await updateBalance(id)
      }
    } catch (e) {
      console.error(e)
    }
  }
}
async function deleteAll() {
  try {
    for (const account of props.accounts) {
      let oldest = Infinity
      const records = await getAllRecordsOfAccount(account.id)
      for (const r of records) {
        if (r.datetime < oldest) {
          oldest = r.datetime
        }
        // don't recompute monthlies to gain some perf
        await deleteRecord(r.id, false)
      }
      // update monthlies only once, manually
      await updateMonthlies(account.id, oldest)
      await updateBalance(account.id)
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
        filters[filter].reconfigure({ locale: $i18n.locale }).toHuman()
      }})
    </h2>
    <FormKit type="select" name="filter" v-model="filter" validation="required">
      <option v-for="(f, index) in filters" :key="index" :value="index">
        {{ f.reconfigure({ locale: $i18n.locale }).toHuman() }}
      </option>
    </FormKit>
  </div>
  <RecordList
    class="m-2"
    :accounts="accounts"
    :categories="categories"
    :labels="labels"
    :records="records"
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

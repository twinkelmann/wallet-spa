<script setup lang="ts">
import CreateRecord from '@/components/CreateRecord.vue'
import RecordList from '@/components/RecordList.vue'
import { DB } from '@/database/db'
import { getAllAccountsOfWallet, type Account } from '@/models/account'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { getAllLabelsOfWallet, type Label } from '@/models/label'
import { getAllRecordsOfAccountsByDate, type Record } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { capitalizeFirstLetter, debounce } from '@/util'
import { DateTime, Duration, type DateTimeUnit } from 'luxon'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

const state = useStateStore()
const stateRefs = storeToRefs(state)
const { locale, t } = useI18n()

const accounts: Ref<RelDocument<Account>[]> = ref([])
const categories: Ref<RelDocument<Category>[]> = ref([])
const records: Ref<RelDocument<Record>[]> = ref([])
const labels: Ref<RelDocument<Label>[]> = ref([])

interface Filter<T extends 'duration' | 'period'> {
  type: T
  filter: any
}

interface DurationFilter extends Filter<'duration'> {
  filter: Duration<true>
}

interface PeriodFilter extends Filter<'period'> {
  filter: DateTimeUnit
}

const filters: (DurationFilter | PeriodFilter)[] = [
  // duration filters
  ...[
    { days: 7 },
    { days: 30 },
    { weeks: 12 },
    { months: 6 },
    { years: 1 },
  ].map(
    (x) =>
      ({ type: 'duration', filter: Duration.fromObject(x) }) as DurationFilter
  ),
  // period filters
  ...['day', 'week', 'month', 'quarter', 'year'].map(
    (x) => ({ type: 'period', filter: x }) as PeriodFilter
  ),
]

function displayFilter(f: DurationFilter | PeriodFilter) {
  if (f.type === 'duration') {
    return f.filter.reconfigure({ locale: locale.value }).toHuman()
  } else {
    return t('time.unit.' + f.filter)
  }
}
function datesFromFilter(
  f: DurationFilter | PeriodFilter,
  p: number
): [DateTime<true>, DateTime<true>] {
  if (f.type === 'duration') {
    // although the page system works for duration, we don't use it in the end
    const start = DateTime.now().minus(f.filter.mapUnits((x) => x * p))
    const end = start.minus(f.filter.mapUnits((x) => x * (p + 1)))
    return [end, start]
  } else {
    const start = DateTime.now()
    const end = start.startOf(f.filter).minus({ [f.filter]: p })
    return [
      end,
      p === 0 ? start : start.startOf(f.filter).minus({ [f.filter]: p - 1 }),
    ]
  }
}

const filter = defineModel({ default: 9 })
const page = ref(0)

const from = ref(DateTime.now())
const to = ref(DateTime.now())

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['account', 'category', 'record', 'label'])

function updateData() {
  if (state.activeWallet) {
    getAllAccountsOfWallet(state.activeWallet)
      .then((res) => {
        accounts.value = res

        const dates = datesFromFilter(filters[filter.value], page.value)
        from.value = dates[0]
        to.value = dates[1]

        return getAllRecordsOfAccountsByDate(
          res.map((a) => a.id),
          dates[0].toMillis(),
          dates[1].toMillis(),
          null,
          true,
          false,
          false
        )
      })
      .then((res) => (records.value = res))
      .catch(console.error)
    getAllCategoriesOfWallet(state.activeWallet)
      .then((res) => (categories.value = res))
      .catch(console.error)
    getAllLabelsOfWallet(state.activeWallet)
      .then((res) => (labels.value = res))
      .catch(console.error)
  }
}
const debouncedUpdateData = debounce(updateData, UPDATE_DATA_DEBOUNCE)

watch(stateRefs.activeWallet, (current, previous) => {
  if (current && current !== previous) {
    updateData()
  }
})
watch(filter, () => {
  page.value = 0
  updateData()
})
watch(page, updateData)

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
</script>

<template>
  <div
    class="w-stretch fixed bottom-0 flex h-12 items-center justify-center bg-zinc-100 dark:bg-zinc-800"
  >
    <div class="flex w-full items-center lg:w-2/3 xl:w-1/2 2xl:w-1/3">
      <button
        @click="page++"
        :class="`material-icons nt-button px-4 ${filters[filter].type !== 'period' ? 'pointer-events-none opacity-0' : ''}`"
      >
        arrow_back_ios_new
      </button>
      <label class="nt-select grow" for="filter">
        <span
          class="nt-form-input pointer-events-none absolute flex h-full w-full select-none items-center justify-center !pr-12"
          >{{
            filters[filter].type === 'period'
              ? capitalizeFirstLetter(
                  $t('time.relative-unit.' + filters[filter].filter, page)
                )
              : (filters[filter].filter as Duration)
                  .reconfigure({ locale: $i18n.locale })
                  .toHuman()
          }}</span
        >
        <select
          class="nt-form-input !text-center"
          id="filter"
          name="filter"
          v-model="filter"
        >
          <option v-for="(f, index) in filters" :key="index" :value="index">
            {{ capitalizeFirstLetter(displayFilter(f)) }}
          </option>
        </select>
      </label>
      <button
        :disabled="page === 0"
        @click="page--"
        :class="`material-icons nt-button px-4 ${filters[filter].type !== 'period' ? 'pointer-events-none opacity-0' : ''}`"
      >
        arrow_forward_ios
      </button>
    </div>
  </div>
  <div class="mx-4 mb-16 flex flex-col items-center">
    <h2 class="text-center text-lg font-medium first-letter:uppercase">
      {{ $t('terminology.record', 2) }}
    </h2>
    <span
      >{{ from.reconfigure({ locale: $i18n.locale }).toLocaleString() }} -
      {{
        to
          .minus({ millisecond: 1 })
          .reconfigure({ locale: $i18n.locale })
          .toLocaleString()
      }}</span
    >
    <RecordList
      class="m-2 mb-24 w-full lg:mb-0 lg:w-2/3 2xl:w-1/2"
      :accounts="accounts"
      :categories="categories"
      :labels="labels"
      :records="records"
    ></RecordList>
    <CreateRecord
      :accounts="accounts"
      :categories="categories"
      :labels="labels"
    ></CreateRecord>
  </div>
</template>

<script setup lang="ts">
import type { Account } from '@/models/account'
import type { Category } from '@/models/category'
import type { ID, RelDocument } from '@/models/common'
import { getAllRecordsOfAccountsByDate, type Record } from '@/models/record'
import { getBalanceAtDate, to2DecimalNumber } from '@/util'
import { DateTime } from 'luxon'
import { computed, ref, watch, type Ref } from 'vue'
import Money from './Money.vue'

const props = defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  from: DateTime
  to: DateTime
}>()

const isolatedCatNames = ['New funding', 'Loans repayment', 'Others']

const startingBalance = ref(0)
const revenues: Ref<{ key: string; value: number }[]> = ref([])
const costs: Ref<{ key: string; value: number }[]> = ref([])
const totalRevenues = computed(() =>
  to2DecimalNumber(revenues.value.reduce((a, b) => a + b.value, 0))
)
const totalCosts = computed(() =>
  to2DecimalNumber(costs.value.reduce((a, b) => a + b.value, 0))
)
const isolatedCats: Ref<{ key: string; value: number }[]> = ref([])

const profit = computed(() =>
  to2DecimalNumber(totalRevenues.value + totalCosts.value)
)
const endingBalance = ref(0)

async function computeStats() {
  // compute starting balance
  const results = await Promise.all(
    props.accounts.map((account) =>
      getBalanceAtDate(account.id, props.from.toMillis())
    )
  )
  startingBalance.value = results.reduce((a, b) => a + b, 0)
  let end = startingBalance.value

  // get all the root categories
  const cats = props.categories.filter((cat) => !cat.categoryId)
  const catNames: { [x: ID]: string } = {}
  const catValues: { [x: ID]: number } = {}
  cats.forEach((cat) => {
    catNames[cat.id] = cat.name
    catValues[cat.id] = 0
  })
  // build index of sub category id to root id
  const catToRootCat: { [x: ID]: ID } = {}
  props.categories.forEach(
    (cat) => (catToRootCat[cat.id] = cat.categoryId ?? cat.id)
  )

  // get all records
  const records = await getAllRecordsOfAccountsByDate(
    props.accounts.map((a) => a.id),
    props.from.toMillis(),
    props.to.toMillis()
  )

  for (const r of records) {
    const cat = catToRootCat[r.categoryId]
    catValues[cat] += r.value
    end += r.value
  }

  endingBalance.value = to2DecimalNumber(end)

  const pos: { key: string; value: number }[] = []
  const neg: { key: string; value: number }[] = []
  const iso: { key: string; value: number }[] = []

  for (const cat of cats) {
    const value = to2DecimalNumber(catValues[cat.id])
    if (value === 0) {
      continue
    }

    const obj = { key: cat.name, value }

    if (isolatedCatNames.includes(cat.name)) {
      iso.push(obj)
    } else if (value > 0) {
      pos.push(obj)
    } else {
      neg.push(obj)
    }
  }

  revenues.value = pos
  costs.value = neg
  isolatedCats.value = iso
}

// TODO: this does not actually update if any of the account/record change
watch(
  () => props.from,
  () => computeStats().catch(console.error)
)
</script>
<template>
  <div
    class="mt-4 flex w-full flex-col gap-4 p-4 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2"
  >
    <table class="w-full table-fixed dark:bg-zinc-900">
      <thead class="wallet-secondary">
        <tr class="border border-zinc-300 dark:border-zinc-500">
          <td class="p-4" colspan="2">Flux de trésoreries en CHF</td>
        </tr>
      </thead>
      <tbody>
        <tr class="border border-zinc-300 dark:border-zinc-500">
          <td class="max-w-[50%] p-4">Solde initial</td>
          <td class="p-4"><Money :amount="startingBalance" /></td>
        </tr>
        <tr class="border border-zinc-300 dark:border-zinc-500">
          <td class="p-4">Revenu d’exploitation</td>
          <td class="p-4"><Money :amount="totalRevenues" /></td>
        </tr>
        <tr class="border border-zinc-300 dark:border-zinc-500">
          <td class="p-4">Coûts d’exploitation</td>
          <td class="p-4"><Money :amount="totalCosts" /></td>
        </tr>
        <tr
          class="border border-zinc-300 dark:border-zinc-500"
          v-for="cat of isolatedCats"
          :key="cat.key"
        >
          <td class="p-4">{{ cat.key }}</td>
          <td class="p-4">
            <Money :amount="cat.value" />
          </td>
        </tr>
        <tr class="border border-zinc-300 dark:border-zinc-500">
          <td class="p-4">Solde de clôture</td>
          <td class="p-4"><Money :amount="endingBalance" /></td>
        </tr>
      </tbody>
    </table>

    <table class="w-full table-fixed dark:bg-zinc-900">
      <tbody>
        <tr class="border border-zinc-300 dark:border-zinc-500">
          <td class="p-4">Bénéfices en CHF</td>
          <td class="p-4"><Money :amount="profit" /></td>
        </tr>
        <tr
          class="border border-zinc-300 bg-zinc-200 dark:border-zinc-500 dark:bg-zinc-700"
        >
          <td class="p-4">Revenu d’exploitation</td>
          <td class="p-4"><Money :amount="totalRevenues" /></td>
        </tr>
        <tr
          class="border border-zinc-300 dark:border-zinc-500"
          v-for="cat of revenues"
          :key="cat.key"
        >
          <td class="p-4">{{ cat.key }}</td>
          <td class="p-4"><Money :amount="cat.value" /></td>
        </tr>
        <tr
          class="border border-zinc-300 bg-zinc-200 dark:border-zinc-500 dark:bg-zinc-700"
        >
          <td class="p-4">Coûts d’exploitation</td>
          <td class="p-4"><Money :amount="totalCosts" /></td>
        </tr>
        <tr
          class="border border-zinc-300 dark:border-zinc-500"
          v-for="cat of costs"
          :key="cat.key"
        >
          <td class="p-4">{{ cat.key }}</td>
          <td class="p-4"><Money :amount="cat.value" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

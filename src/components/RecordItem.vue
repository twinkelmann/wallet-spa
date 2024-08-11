<script setup lang="ts">
import type { Account } from '@/models/account'
import type { Category } from '@/models/category'
import type { ById, RelDocument } from '@/models/common'
import type { Label } from '@/models/label'
import type { Record } from '@/models/record'
import { useSettingsStore } from '@/stores/settings'
import { useBlackText } from '@/util'
import { DateTime } from 'luxon'
import { computed } from 'vue'

const settings = useSettingsStore()

const props = defineProps<{
  record: RelDocument<Record>
  account: Account
  categoriesById: ById<RelDocument<Category>>
  labelsById: ById<RelDocument<Label>>
}>()
const desc = computed(() => {
  return [props.record.description, props.record.payee]
    .filter(Boolean)
    .join(' - ')
})
const category = computed(() => {
  return props.categoriesById[props.record.categoryId]
})
const labels = computed(() => {
  return props.record.labelIds.map((id) => props.labelsById[id])
})
</script>
<template>
  <div class="flex w-full gap-4">
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      :style="`background-color: ${category.color}`"
    >
      <i
        :class="`material-icons ${
          useBlackText(category.color) ? 'text-black' : 'text-white'
        }`"
        >{{ category.icon }}</i
      >
    </div>
    <div class="flex grow flex-col">
      <span class="font-medium">{{ category.name }}</span>
      <span>{{ account.name }}</span>
      <span class="italic" v-if="desc">"{{ desc }}"</span>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="label of labels"
          :key="label.id"
          :style="`background-color: ${label.color}`"
          :class="`rounded-lg px-3 py-1 text-sm ${
            useBlackText(label.color) ? 'text-black' : 'text-white'
          }`"
        >
          {{ label.name }}
        </li>
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
        DateTime.fromMillis(record.datetime)
          .reconfigure({ locale: $i18n.locale })
          .toLocaleString({
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
      }}</span>
    </div>
  </div>
</template>

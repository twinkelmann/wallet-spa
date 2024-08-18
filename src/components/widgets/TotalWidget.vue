<script setup lang="ts">
import type { RelDocument } from '@/models/common'
import type { Account } from '@/models/account'
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{ accounts: RelDocument<Account>[] }>()

const settings = useSettingsStore()

// TODO: handle the fact that there can be many currencies
const total = computed(() =>
  props.accounts
    .reduce((acc, val) => acc + (val.startBalance + val.balance), 0)
    .toLocaleString(settings.numberLocale, {
      style: 'currency',
      currency: 'CHF',
    })
)
</script>
<template>
  <div class="mx-4 mb-2">
    <h2 class="text-lg font-light">{{ $t('widgets.total.title', 2) }}</h2>
    <span class="text-3xl font-medium">{{ total }}</span>
  </div>
</template>

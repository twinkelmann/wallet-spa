<script setup lang="ts">
import { capitalizeFirstLetter } from '@/models/common'
import type { Record } from '@/models/record'
import { useStateStore } from '@/stores/state'
import { useWalletsStore } from '@/stores/wallets'
import { DateTime } from 'luxon'

const wallets = useWalletsStore()
const state = useStateStore()

const { record } = defineProps<{
  record: Record | null
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

function stringTo2DecimalNumber(input: string) {
  return Math.round(parseFloat(input) * 100) / 100
}

const submit = async (fields: any) => {
  try {
    if (record?.id) {
      wallets.updateRecord(
        record.id,
        fields.accountId,
        stringTo2DecimalNumber(fields.value),
        fields.payee,
        fields.description,
        fields.datetime
      )
    } else {
      wallets.createRecord(
        fields.accountId,
        stringTo2DecimalNumber(fields.value),
        fields.payee,
        fields.description,
        fields.datetime
      )
    }
  } catch (e) {
    alert(e)
    console.error(e)
  }
  emit('done')
}
</script>
<template>
  <FormKit
    type="form"
    @submit="submit"
    :submit-label="
      capitalizeFirstLetter(record ? $t('update.record') : $t('create.record'))
    "
  >
    <FormKit
      type="select"
      name="accountId"
      :label="capitalizeFirstLetter($t('terminology.account'))"
      :value="record?.accountId || state.activeAccounts[0]?.id"
      validation="required"
    >
      <option
        v-for="account of state.activeAccounts"
        :key="account.id"
        :value="account.id"
      >
        {{ account.name }}
      </option>
    </FormKit>
    <FormKit
      type="number"
      name="value"
      :label="$t('forms.labels.value')"
      :value="record?.value"
      validation="required"
      step=".01"
    />
    <FormKit
      type="text"
      name="payee"
      :label="$t('forms.labels.payee')"
      :placeholder="$t('forms.placeholders.payee')"
      :value="record?.payee || ''"
    />
    <FormKit
      type="text"
      name="description"
      :label="$t('forms.labels.description')"
      :placeholder="$t('forms.placeholders.description')"
      :value="record?.description || ''"
    />
    <FormKit
      type="datetime-local"
      name="datetime"
      :label="$t('forms.labels.datetime')"
      :value="
        (record?.datetime ? DateTime.fromISO(record.datetime) : DateTime.now())
          .set({ second: 0, millisecond: 0 })
          .toISO({ includeOffset: false, suppressSeconds: true })
      "
      validation="required"
    />
  </FormKit>
</template>

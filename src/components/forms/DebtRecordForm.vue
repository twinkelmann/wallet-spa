<script setup lang="ts">
import type { Account } from '@/models/account'
import type { Category } from '@/models/category'
import { type RelDocument } from '@/models/common'
import { type Debt } from '@/models/debt'
import type { Label } from '@/models/label'
import { createRecord, type Record } from '@/models/record'
import { capitalizeFirstLetter, to2DecimalNumber } from '@/util'
import { DateTime } from 'luxon'

const props = defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
  debt: RelDocument<Debt>
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  try {
    // create a record for the given debt
    const value = to2DecimalNumber(fields.value)
    const datetime = DateTime.fromISO(fields.datetime).toMillis()
    // TODO: find a way to support custom categories but still auto assign this
    const category = value < 0 ? 'Loan, interests' : 'Lending, renting'
    await createRecord(
      fields.accountId,
      props.categories.find((c) => c.name === category)?.id ??
        props.categories[0].id,
      fields.labelIds,
      props.debt.id,
      value,
      props.debt.payee,
      fields.description,
      datetime
    )
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
    :submit-label="capitalizeFirstLetter($t('create.record'))"
  >
    <FormKit
      type="select"
      name="accountId"
      :label="capitalizeFirstLetter($t('terminology.account'))"
      :value="accounts[0]?.id"
      validation="required"
    >
      <option v-for="account of accounts" :key="account.id" :value="account.id">
        {{ account.name }}
      </option>
    </FormKit>
    <FormKit
      type="number"
      name="value"
      :label="$t('forms.labels.value')"
      :placeholder="$t('debt.repay', { amount: -debt.balance })"
      validation="required"
      step=".01"
    />
    <FormKit
      type="text"
      name="description"
      :label="$t('forms.labels.description')"
      :placeholder="$t('forms.placeholders.description')"
      :value="debt.description || ''"
    />
    <FormKit
      type="datetime-local"
      name="datetime"
      :label="$t('forms.labels.datetime')"
      :value="
        DateTime.now()
          .set({ second: 0, millisecond: 0 })
          .toISO({ includeOffset: false, suppressSeconds: true })
      "
      validation="required"
    />
    <FormKit
      type="checkbox"
      name="labelIds"
      decorator-icon="check"
      :label="capitalizeFirstLetter($t('terminology.label', 2))"
      :value="[]"
      :options="labels.map((l) => ({ value: l.id, label: l.name }))"
    >
    </FormKit>
  </FormKit>
</template>

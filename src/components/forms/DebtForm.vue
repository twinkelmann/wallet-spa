<script setup lang="ts">
import type { Account } from '@/models/account'
import type { Category } from '@/models/category'
import { type ID, type RelDocument } from '@/models/common'
import { createDebt, updateDebt, type Debt } from '@/models/debt'
import type { Label } from '@/models/label'
import { createRecord, type Record } from '@/models/record'
import { capitalizeFirstLetter, to2DecimalNumber } from '@/util'
import { DateTime } from 'luxon'

const props = defineProps<{
  walletId: ID
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
  debt: RelDocument<Debt> | null
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  try {
    if (props.debt) {
      // update only the debt
      await updateDebt(
        props.debt.id,
        props.debt.balance,
        fields.payee,
        fields.description,
        props.debt.closed
      )
    } else {
      // create a debt, then create a record for it
      const balance = to2DecimalNumber(fields.value)
      const datetime = DateTime.fromISO(fields.datetime).toMillis()
      const debtId = await createDebt(
        props.walletId,
        balance,
        fields.payee,
        fields.description
      )
      // TODO: find a way to support custom categories but still auto assign this
      const category = balance < 0 ? 'Loan, interests' : 'Lending, renting'
      await createRecord(
        fields.accountId,
        props.categories.find((c) => c.name === category)?.id ??
          props.categories[0].id,
        fields.labelIds,
        debtId,
        null,
        balance,
        fields.payee,
        fields.description,
        datetime
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
      capitalizeFirstLetter(debt ? $t('update.debt') : $t('create.debt'))
    "
  >
    <FormKit
      type="text"
      name="payee"
      :label="$t('forms.labels.payee')"
      :placeholder="$t('forms.placeholders.payee')"
      :value="debt?.payee || ''"
      validation="required"
    />
    <FormKit
      type="text"
      name="description"
      :label="$t('forms.labels.description')"
      :placeholder="$t('forms.placeholders.description')"
      :value="debt?.description || ''"
    />
    <!-- Fields used to create the first record
   Only present if creating a debt -->
    <FormKit
      v-if="!debt"
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
      v-if="!debt"
      type="number"
      name="value"
      :label="$t('forms.labels.value')"
      validation="required"
      step=".01"
    />
    <FormKit
      v-if="!debt"
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
      v-if="!debt"
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

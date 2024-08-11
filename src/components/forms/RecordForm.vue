<script setup lang="ts">
import type { Account } from '@/models/account'
import type { Category } from '@/models/category'
import { type RelDocument } from '@/models/common'
import type { Label } from '@/models/label'
import { createRecord, updateRecord, type Record } from '@/models/record'
import { capitalizeFirstLetter, to2DecimalNumber } from '@/util'
import { DateTime } from 'luxon'

const props = defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
  record: RelDocument<Record> | null
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  const datetime = DateTime.fromISO(fields.datetime).toMillis()
  try {
    if (props.record) {
      await updateRecord(
        props.record.id,
        fields.accountId,
        fields.categoryId,
        fields.labelIds,
        to2DecimalNumber(fields.value),
        fields.payee,
        fields.description,
        datetime
      )
    } else {
      await createRecord(
        fields.accountId,
        fields.categoryId,
        fields.labelIds,
        to2DecimalNumber(fields.value),
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
  <!-- TODO: make this form very pretty (and full screen)-->
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
      :value="record?.accountId || accounts[0]?.id"
      validation="required"
    >
      <option v-for="account of accounts" :key="account.id" :value="account.id">
        {{ account.name }}
      </option>
    </FormKit>
    <FormKit
      type="select"
      name="categoryId"
      :label="capitalizeFirstLetter($t('terminology.category'))"
      :value="record?.categoryId || categories[0]?.id"
      validation="required"
    >
      <option
        v-for="category of categories"
        :key="category.id"
        :value="category.id"
      >
        {{ category.name }}
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
        (record?.datetime
          ? DateTime.fromMillis(record.datetime)
          : DateTime.now()
        )
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
      :value="record?.labelIds || []"
      :options="labels.map((l) => ({ value: l.id, label: l.name }))"
    >
    </FormKit>
  </FormKit>
</template>

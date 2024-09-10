<script setup lang="ts">
import type { Account } from '@/models/account'
import type { Category } from '@/models/category'
import { type RelDocument } from '@/models/common'
import type { Label } from '@/models/label'
import {
  createRecord,
  getRecord,
  updateRecord,
  type Record,
} from '@/models/record'
import { capitalizeFirstLetter, to2DecimalNumber } from '@/util'
import { DateTime } from 'luxon'
import { computed } from 'vue'

const props = defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
  record: RelDocument<Record> | null
  createTransfer?: boolean
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

const defaultCategoryId = computed(() => props.categories[0].id)

const submit = async (fields: any) => {
  const datetime = DateTime.fromISO(fields.datetime).toMillis()
  try {
    const value = to2DecimalNumber(fields.value)
    if (props.record) {
      // TODO: find a way to support custom categories but still auto assign this
      const category = value < 0 ? 'Loan, interests' : 'Lending, renting'
      await updateRecord(
        props.record.id,
        fields.accountId,
        props.record.debtId
          ? props.categories.find((c) => c.name === category)?.id
          : props.record.transferId
            ? defaultCategoryId.value
            : fields.categoryId,
        fields.labelIds,
        props.record.transferId,
        value,
        fields.payee,
        fields.description,
        datetime
      )

      if (props.record.transferId) {
        const transfer = await getRecord(props.record.transferId)
        if (transfer) {
          await updateRecord(
            transfer.id,
            transfer.accountId,
            // debts are not transfers, ignore special case
            defaultCategoryId.value,
            fields.labelIds,
            props.record.id,
            -value,
            fields.payee,
            fields.description,
            datetime
          )
        }
      }
    } else {
      const recId = await createRecord(
        fields.accountId,
        props.createTransfer ? defaultCategoryId.value : fields.categoryId,
        fields.labelIds,
        null,
        null,
        props.createTransfer ? -value : value,
        fields.payee,
        fields.description,
        datetime
      )

      if (props.createTransfer) {
        const transferId = await createRecord(
          fields.toAccountId,
          defaultCategoryId.value,
          fields.labelIds,
          null,
          recId,
          value,
          fields.payee,
          fields.description,
          datetime
        )

        await updateRecord(
          recId,
          fields.accountId,
          defaultCategoryId.value,
          fields.labelIds,
          transferId,
          -value,
          fields.payee,
          fields.description,
          datetime
        )
      }
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
      capitalizeFirstLetter(
        record
          ? $t('update.record')
          : createTransfer
            ? $t('create.transfer')
            : $t('create.record')
      )
    "
  >
    <FormKit
      type="select"
      name="accountId"
      :label="
        createTransfer
          ? $t('forms.labels.from-account')
          : capitalizeFirstLetter($t('terminology.account'))
      "
      :value="record?.accountId || accounts[0]?.id"
      validation="required"
    >
      <option v-for="account of accounts" :key="account.id" :value="account.id">
        {{ account.name }}
      </option>
    </FormKit>
    <FormKit
      v-if="createTransfer"
      type="select"
      name="toAccountId"
      :label="$t('forms.labels.to-account')"
      :value="record?.accountId || accounts[0]?.id"
      validation="required"
    >
      <option v-for="account of accounts" :key="account.id" :value="account.id">
        {{ account.name }}
      </option>
    </FormKit>
    <FormKit
      v-if="!createTransfer"
      type="select"
      name="categoryId"
      :label="capitalizeFirstLetter($t('terminology.category'))"
      :value="record?.categoryId || categories[0]?.id"
      validation="required"
      :disabled="record?.debtId"
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
      :disabled="record?.debtId"
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

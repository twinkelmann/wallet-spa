<script setup lang="ts">
import {
  createAccount,
  currencies,
  updateAccount,
  type Account,
} from '@/models/account'
import {
  capitalizeFirstLetter,
  type ID,
  type RelDocument,
} from '@/models/common'

const props = defineProps<{
  account: RelDocument<Account> | null
  walletId: ID
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  try {
    if (props.account) {
      await updateAccount(
        props.account.id,
        fields.name,
        fields.color,
        props.account.balance,
        fields.currency
      )
    } else {
      await createAccount(
        props.walletId,
        fields.name,
        fields.color,
        fields.currency
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
      capitalizeFirstLetter(
        account ? $t('update.account') : $t('create.account')
      )
    "
  >
    <FormKit
      type="text"
      name="name"
      :label="$t('forms.labels.name')"
      :placeholder="$t('forms.placeholders.account-name')"
      :value="account?.name"
      validation="required"
    />
    <FormKit
      type="color"
      name="color"
      :label="$t('forms.labels.color')"
      :value="account?.color || '#FF0000'"
      validation="required"
    />
    <FormKit
      type="select"
      name="currency"
      :label="$t('forms.labels.currency')"
      :value="account?.currency || currencies[0]"
      validation="required"
    >
      <option v-for="currency of currencies" :key="currency" :value="currency">
        {{ $t(`currencies.${currency}`) }} ({{ currency }})
      </option>
    </FormKit>
  </FormKit>
</template>

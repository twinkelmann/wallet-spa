<script setup lang="ts">
import { currencies, type Account } from '@/models/account'
import { capitalizeFirstLetter, type UUID } from '@/models/common'
import { useWalletsStore } from '@/stores/wallets'

const wallets = useWalletsStore()

const { account, walletId } = defineProps<{
  account: Account | null
  walletId: UUID
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  try {
    if (account?.id) {
      wallets.updateAccount(account, fields.name, fields.color, fields.currency)
    } else {
      wallets.createAccount(
        walletId,
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

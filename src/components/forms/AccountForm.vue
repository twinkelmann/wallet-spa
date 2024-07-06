<script setup lang="ts">
import { currencies, type Account } from '@/models/account'
import type { UUID } from '@/models/common'
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
      wallets.updateAccount(
        account,
        fields.name,
        fields.color,
        currencies[fields.currency]
      )
    } else {
      wallets.createAccount(
        walletId,
        fields.name,
        fields.color,
        currencies[fields.currency]
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
    :submit-label="account ? 'Update Account' : 'Create Account'"
  >
    <FormKit
      type="text"
      name="name"
      label="Name"
      placeholder="Cash"
      :value="account?.name"
      validation="required"
    />
    <FormKit
      type="color"
      name="color"
      label="Color"
      :value="account?.color || '#FF0000'"
      validation="required"
    />
    <FormKit
      type="select"
      name="currency"
      label="Currency"
      :value="account ? currencies.indexOf(account.currency) : 0"
      validation="required"
    >
      <option
        v-for="(currency, i) in currencies"
        :key="currency.code"
        :value="i"
      >
        {{ currency.name }} ({{ currency.code }})
      </option>
    </FormKit>
  </FormKit>
</template>

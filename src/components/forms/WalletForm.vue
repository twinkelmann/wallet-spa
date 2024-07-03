<script setup lang="ts">
import type { Wallet } from '@/models/wallet'
import { useWalletsStore } from '@/stores/wallets'

const wallets = useWalletsStore()

const { wallet } = defineProps<{ wallet: Wallet | null }>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  try {
    if (wallet?.id) {
      wallets.updateWallet(wallet, fields.name)
    } else {
      wallets.createWallet(fields.name)
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
    :submit-label="wallet ? 'Update Wallet' : 'Create Wallet'"
  >
    <FormKit
      type="text"
      name="name"
      label="Name"
      placeholder="My Personnal Wallet"
      :value="wallet?.name"
      validation="required"
    />
  </FormKit>
</template>

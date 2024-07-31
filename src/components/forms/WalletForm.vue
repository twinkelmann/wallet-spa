<script setup lang="ts">
import { capitalizeFirstLetter } from '@/models/common'
import { createWallet, updateWallet, type Wallet } from '@/models/wallet'
import { useWalletsStore } from '@/stores/wallets'

const { wallet } = defineProps<{ wallet: Wallet | null }>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  try {
    if (wallet?.id) {
      await updateWallet(wallet?.id, fields.name)
    } else {
      await createWallet(fields.name)
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
      capitalizeFirstLetter(wallet ? $t('update.wallet') : $t('create.wallet'))
    "
  >
    <FormKit
      type="text"
      name="name"
      :label="$t('forms.labels.name')"
      :placeholder="$t('forms.placeholders.wallet-name')"
      :value="wallet?.name"
      validation="required"
    />
  </FormKit>
</template>

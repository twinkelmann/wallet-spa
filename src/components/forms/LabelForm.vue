<script setup lang="ts">
import { createLabel, updateLabel, type Label } from '@/models/label'
import {
  capitalizeFirstLetter,
  type ID,
  type RelDocument,
} from '@/models/common'

const props = defineProps<{
  label: RelDocument<Label> | null
  walletId: ID
}>()
const emit = defineEmits<{ (e: 'done'): void }>()

const submit = async (fields: any) => {
  try {
    if (props.label) {
      await updateLabel(props.label.id, fields.name, fields.color)
    } else {
      await createLabel(props.walletId, fields.name, fields.color)
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
      capitalizeFirstLetter(label ? $t('update.label') : $t('create.label'))
    "
  >
    <FormKit
      type="text"
      name="name"
      :label="$t('forms.labels.name')"
      :placeholder="$t('forms.placeholders.label-name')"
      :value="label?.name"
      validation="required"
    />
    <FormKit
      type="color"
      name="color"
      :label="$t('forms.labels.color')"
      :value="label?.color || '#2cd6c8'"
      validation="required"
    />
  </FormKit>
</template>

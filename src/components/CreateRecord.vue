<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import RecordForm from './forms/RecordForm.vue'
import type { RelDocument } from '@/models/common'
import type { Account } from '@/models/account'
import type { Label } from '@/models/label'
import type { Category } from '@/models/category'

defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
}>()

const showModal = ref(false)
</script>

<template>
  <button
    class="nt-icon-button wallet-primary fixed bottom-8 right-8"
    @click="showModal = true"
  >
    add
  </button>
  <Teleport to="body">
    <BaseModal
      :header="$t('create.record')"
      :show="showModal"
      @close="showModal = false"
    >
      <div class="p-4">
        <RecordForm
          :record="null"
          :accounts="accounts"
          :categories="categories"
          :labels="labels"
          @done="showModal = false"
        ></RecordForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

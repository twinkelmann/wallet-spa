<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import RecordForm from './forms/RecordForm.vue'
import type { RelDocument } from '@/models/common'
import type { Account } from '@/models/account'
import type { Label } from '@/models/label'

defineProps<{
  accounts: RelDocument<Account>[]
  labels: RelDocument<Label>[]
}>()

const showModal = ref(false)
</script>

<template>
  <button
    class="nt-clickable nt-focus-ring material-icons fixed bottom-8 right-8 rounded-full bg-blue-400 p-5 text-lg text-white shadow-lg print:hidden"
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
          :labels="labels"
          @done="showModal = false"
        ></RecordForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

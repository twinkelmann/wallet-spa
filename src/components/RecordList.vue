<script setup lang="ts">
import RecordItem from './RecordItem.vue'
import type { Record } from '@/models/record'
import { computed, ref, type Ref } from 'vue'
import BaseModal from './BaseModal.vue'
import RecordForm from './forms/RecordForm.vue'
import type { RelDocument, ById } from '@/models/common'
import type { Account } from '@/models/account'

const props = defineProps<{
  class: string
  records: RelDocument<Record>[]
  accounts: RelDocument<Account>[]
}>()

const accountsById = computed(() => {
  const obj: ById<Account> = {}
  props.accounts.forEach((a) => {
    obj[a.id] = a
  })
  return obj
})

const editedRecord: Ref<Record | null> = ref(null)
const showModal = ref(false)

function updateRecord(record: Record) {
  editedRecord.value = record
  showModal.value = true
}
</script>

<template>
  <ul :class="class">
    <li v-for="record of records" :key="record.id">
      <button
        class="nt-clickable nt-focus-ring w-full border-b border-gray-100 p-2 text-left last:border-none"
        @click="updateRecord(record)"
      >
        <RecordItem
          :record="record"
          :account="accountsById[record.accountId]"
        ></RecordItem>
      </button>
    </li>
  </ul>
  <Teleport to="body">
    <BaseModal
      :header="editedRecord ? $t('update.record') : $t('create.record')"
      :show="showModal"
      @close="showModal = false"
    >
      <div class="p-4">
        <RecordForm
          :record="editedRecord"
          :accounts="accounts"
          @done="showModal = false"
        ></RecordForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

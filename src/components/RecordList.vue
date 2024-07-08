<script setup lang="ts">
import RecordItem from './RecordItem.vue'
import type { Record } from '@/models/record'
import { ref, type Ref } from 'vue'
import BaseModal from './BaseModal.vue'
import RecordForm from './forms/RecordForm.vue'

const { records } = defineProps<{ class: string; records: Record[] }>()

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
        <RecordItem :record="record"></RecordItem>
      </button>
    </li>
  </ul>
  <Teleport to="body">
    <BaseModal
      :header="editedRecord ? 'Update Record' : 'Create Record'"
      :show="showModal"
      @close="showModal = false"
    >
      <div class="p-4">
        <RecordForm
          :record="editedRecord"
          @done="showModal = false"
        ></RecordForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

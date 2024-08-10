<script setup lang="ts">
import RecordItem from './RecordItem.vue'
import type { Record } from '@/models/record'
import { computed, ref, type Ref } from 'vue'
import BaseModal from './BaseModal.vue'
import RecordForm from './forms/RecordForm.vue'
import type { RelDocument, ById } from '@/models/common'
import type { Account } from '@/models/account'
import type { Label } from '@/models/label'
import type { Category } from '@/models/category'

const props = defineProps<{
  class: string
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
  records: RelDocument<Record>[]
}>()

const accountsById = computed(() => {
  const obj: ById<RelDocument<Account>> = {}
  props.accounts.forEach((a) => {
    obj[a.id] = a
  })
  return obj
})

const labelsById = computed(() => {
  const obj: ById<RelDocument<Label>> = {}
  props.labels.forEach((l) => {
    obj[l.id] = l
  })
  return obj
})

const categoriesById = computed(() => {
  const obj: ById<RelDocument<Category>> = {}
  props.categories.forEach((c) => {
    obj[c.id] = c
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
          :categoriesById="categoriesById"
          :labelsById="labelsById"
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
          :categories="categories"
          :labels="labels"
          @done="showModal = false"
        ></RecordForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

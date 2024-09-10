<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import RecordForm from './forms/RecordForm.vue'
import type { RelDocument } from '@/models/common'
import type { Account } from '@/models/account'
import type { Label } from '@/models/label'
import type { Category } from '@/models/category'
import { onMounted } from 'vue'
import { onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'

defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
}>()

const root: Ref<HTMLDivElement | null> = ref(null)

const showModal = ref(false)
const showOptions = ref(false)
const createTransfer = ref(false)

function showCreateTransfer() {
  showModal.value = createTransfer.value = true
}

function done() {
  showModal.value = createTransfer.value = false
}

const listener = (ev: MouseEvent | TouchEvent) => {
  if (
    !root.value ||
    !showOptions.value ||
    root.value.contains(ev.target as Node)
  ) {
    return
  }
  requestAnimationFrame(() => {
    showOptions.value = false
  })
}

onMounted(() => {
  document.addEventListener('mousedown', listener)
  document.addEventListener('touchstart', listener)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', listener)
  document.removeEventListener('touchstart', listener)
})
</script>

<template>
  <div
    class="fixed bottom-8 right-8 flex flex-col-reverse items-end gap-4"
    ref="root"
  >
    <button
      :hidden="showOptions"
      class="nt-icon-button wallet-primary"
      @click="showOptions = true"
    >
      add
    </button>
    <div v-if="showOptions" class="flex items-center gap-4">
      <span
        class="rounded-md bg-zinc-100/75 px-4 py-2 first-letter:uppercase dark:bg-zinc-800/75"
        >{{ $t('create.record') }}</span
      >

      <button class="nt-icon-button wallet-primary" @click="showModal = true">
        receipt_long
      </button>
    </div>
    <div v-if="showOptions" class="flex items-center gap-4">
      <span
        class="rounded-md bg-zinc-100/75 px-4 py-2 first-letter:uppercase dark:bg-zinc-800/75"
        >{{ $t('create.transfer') }}</span
      >

      <button
        class="nt-icon-button wallet-secondary"
        @click="showCreateTransfer()"
        :disabled="accounts.length < 2"
      >
        sync_alt
      </button>
    </div>
  </div>
  <Teleport to="body">
    <BaseModal
      :header="createTransfer ? $t('create.transfer') : $t('create.record')"
      :show="showModal"
      @close="done()"
    >
      <div class="p-4">
        <RecordForm
          :record="null"
          :accounts="accounts"
          :categories="categories"
          :labels="labels"
          :create-transfer="createTransfer"
          @done="done()"
        ></RecordForm>
      </div>
    </BaseModal>
  </Teleport>
</template>

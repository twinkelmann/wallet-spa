<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'
import LabelForm from '@/components/forms/LabelForm.vue'
import { DB } from '@/database/db'
import { UPDATE_DATA_DEBOUNCE, type RelDocument } from '@/models/common'
import { deleteLabel, getAllLabelsOfWallet, type Label } from '@/models/label'
import { useStateStore } from '@/stores/state'
import { capitalizeFirstLetter, debounce } from '@/util'
import { storeToRefs } from 'pinia'
import type { Ref } from 'vue'
import { onBeforeUnmount } from 'vue'
import { watch } from 'vue'
import { onMounted } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const state = useStateStore()
const stateRefs = storeToRefs(state)
const { t } = useI18n()

const editedLabel: Ref<RelDocument<Label> | null> = ref(null)
const showModal = ref(false)
const labels: Ref<RelDocument<Label>[]> = ref([])

function createLabel() {
  editedLabel.value = null
  showModal.value = true
}

function updateLabel(label: RelDocument<Label>) {
  editedLabel.value = label
  showModal.value = true
}

async function onDeletLabel(label: RelDocument<Label>) {
  if (confirm(capitalizeFirstLetter(`${t('delete.label')} ?`))) {
    try {
      await deleteLabel(label.id)
    } catch (e) {
      alert(e)
      console.error(e)
    }
  }
}

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['label'])

function updateData() {
  if (state.activeWallet) {
    getAllLabelsOfWallet(state.activeWallet).then((res) => {
      labels.value = res
    })
  }
}
const debouncedUpdateData = debounce(updateData, UPDATE_DATA_DEBOUNCE)

watch(stateRefs.activeWallet, (current, previous) => {
  if (current && current !== previous) {
    updateData()
  }
})

onMounted(() => {
  if (state.activeWallet) {
    updateData()
  }

  DB.then((db) => {
    changes = db
      .changes({
        since: 'now',
        live: true,
      })
      .on('change', (change) => {
        if (importantChanges.has(db.rel.parseDocID(change.id).type)) {
          debouncedUpdateData()
        }
      })
      .on('error', console.error)
  })
})

onBeforeUnmount(() => {
  if (changes) {
    changes.cancel()
  }
})
</script>

<template>
  <div class="mx-4 mb-4 flex flex-col items-center">
    <h2 class="text-center text-lg font-medium first-letter:uppercase">
      {{ $t('terminology.label', 2) }}
    </h2>
    <ul
      class="flex w-full flex-col gap-2 p-4 sm:w-2/3 md:w-full lg:w-2/3 2xl:w-1/2"
    >
      <li
        v-for="label of labels"
        :key="label.id"
        class="nt-clickable flex rounded-md bg-zinc-100 dark:bg-zinc-900"
      >
        <button
          class="nt-focus-ring flex w-0 grow items-center rounded-l-md p-4"
          @click="updateLabel(label)"
        >
          <span class="truncate"> {{ label.name }}</span>
          <i class="material-icons nt-focus-ring ml-auto">edit</i>
        </button>
        <button
          class="material-icons nt-focus-ring rounded-r-md p-4"
          @click="onDeletLabel(label)"
        >
          delete
        </button>
      </li>
      <li>
        <button
          class="nt-button wallet-primary w-full first-letter:uppercase"
          @click="createLabel()"
        >
          {{ $t('create.label') }}
        </button>
      </li>
    </ul>
    <Teleport to="body">
      <BaseModal
        :header="editedLabel ? $t('update.label') : $t('create.label')"
        :show="showModal"
        @close="showModal = false"
      >
        <div class="p-4" v-if="state.activeWallet">
          <LabelForm
            :wallet-id="state.activeWallet"
            :label="editedLabel"
            @done="showModal = false"
          ></LabelForm>
        </div>
      </BaseModal>
    </Teleport>
  </div>
</template>

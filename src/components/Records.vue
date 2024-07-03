<script setup lang="ts">
import { useWalletsStore } from '@/stores/wallets'
import { computed, ref, type Ref } from 'vue'
import { useStateStore } from '@/stores/state'
import type { UUID } from '@/models/common'
import moment from 'moment'
import BaseModal from './BaseModal.vue'

const state = useStateStore()
const wallets = useWalletsStore()

const accountId: Ref<UUID | null> = ref(null)
const value = ref(0)
const payee = ref('')
const description = ref('')
const datetime = ref(moment().format('yyyy-MM-DDTHH:mm'))

function createRecord() {
  if (state.activeWallet && accountId.value) {
    showModal.value = false
    wallets.createRecord(
      accountId.value,
      value.value,
      payee.value,
      description.value,
      moment(datetime.value).toDate()
    )
  }
}

function deleteRecord(id: UUID) {
  if (confirm('Delete Record ?')) {
    wallets.deleteRecord(id)
  }
}

const orderedRecords = computed(() => {
  return [...state.activeRecords].sort(
    (a, b) => a.datetime.valueOf() - b.datetime.valueOf()
  )
})

const showModal = ref(false)

function choose<T>(array: T[]): T {
  const index = Math.random() * array.length
  return array[Math.floor(index)]
}

const lorem =
  'Minima recusandae minus repudiandae maiores Assumenda omnis nobis facere perspiciatis Hic sint asperiores adipisci quaerat quia Tenetur aut qui dolor aut aut numquam distinctio Laborum consequatur saepe consequatur voluptas magni Aut atque et eligendi ducimus distinctio quo'.split(
    ' '
  )
function randomText() {
  return new Array(Math.floor(Math.random() * 7) + 3)
    .fill('')
    .map(() => choose(lorem))
    .join(' ')
}

function randomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
}

function addTestData() {
  if (state.activeWallet) {
    for (let i = 0; i < 250; i++) {
      wallets.createRecord(
        choose(state.activeAccounts).id,
        +(Math.random() * 1000 - 500).toFixed(2),
        null,
        randomText(),
        randomDate(new Date(2022, 0, 1), new Date())
      )
    }
  }
}
function deleteAll() {
  state.activeRecords.forEach((r) => wallets.deleteRecord(r.id))
}
</script>

<template>
  <span class="ml-4">Records</span>
  <ul class="m-4 flex flex-col gap-4">
    <li
      class="flex w-full items-center rounded-md bg-gray-100 p-2"
      v-for="record of orderedRecords"
      :key="record.id"
    >
      {{ state.accountById[record.accountId].name }}:
      {{ state.accountById[record.accountId].currency.code }}
      {{ record.value }}
      {{ record.description }}
      <button
        class="nt-button ml-auto w-9 bg-gray-600"
        @click="deleteRecord(record.id)"
      >
        <span class="material-icons text-sm">delete</span>
      </button>
    </li>
  </ul>
  <button class="gap-2 rounded-md p-2" @click="showModal = true">New</button>
  <button class="nt-button m-4 bg-red-900" @click="addTestData()">
    Add test data
  </button>
  <button class="nt-button m-4 bg-red-900" @click="deleteAll()">
    Delete all records in active Wallet
  </button>

  <Teleport to="body">
    <BaseModal header="New Record" :show="showModal" @close="showModal = false">
      <div class="flex flex-col gap-2 p-4">
        <label class="nt-form-label" for="new-record-account">Account</label>
        <!-- Records -->
        <label class="nt-select" for="new-record-account">
          <select
            class="nt-form-input"
            v-model="accountId"
            name="new-record-account"
            id="new-record-account"
          >
            <option
              v-for="account of state.activeAccounts"
              :key="account.id"
              :value="account.id"
            >
              {{ account.name }}
            </option>
          </select></label
        >
        <label class="nt-form-label" for="new-record-value">Value</label>
        <input
          class="nt-form-input"
          v-model="value"
          type="number"
          name="new-record-value"
          id="new-record-value"
        />
        <label class="nt-form-label" for="new-record-payee">Payee</label>
        <input
          class="nt-form-input"
          v-model="payee"
          type="text"
          name="new-record-payee"
          id="new-record-payee"
        />
        <label class="nt-form-label" for="new-record-description"
          >Description</label
        >
        <input
          class="nt-form-input"
          v-model="description"
          type="text"
          name="new-record-description"
          id="new-record-description"
        />
        <label class="nt-form-label" for="new-record-datetime">Datetime</label>
        <input
          class="nt-form-input"
          v-model="datetime"
          type="datetime-local"
          name="new-record-datetime"
          id="new-record-datetime"
        />
        <button
          class="nt-button mt-2 bg-emerald-800 px-4"
          @click="createRecord()"
          :disabled="!accountId"
        >
          Create
        </button>
      </div>
    </BaseModal>
  </Teleport>
</template>

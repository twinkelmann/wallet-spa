<script setup lang="ts">
import { DateTime, Duration } from 'luxon'
import {
  createRecord,
  getAllRecordsOfAccountsByDate,
  getRecord,
  updateRecord,
  type Record,
} from '@/models/record'
import RecordList from '../RecordList.vue'
import {
  UPDATE_DATA_DEBOUNCE,
  type ID,
  type RelDocument,
} from '@/models/common'
import {
  createAccount,
  getAccount,
  updateAccount,
  type Account,
} from '@/models/account'
import { useStateStore } from '@/stores/state'
import { watch } from 'vue'
import { createLabel, type Label } from '@/models/label'
import { getAllCategoriesOfWallet, type Category } from '@/models/category'
import type { Ref } from 'vue'
import { ref } from 'vue'
import {
  debounce,
  updateMonthlies,
  updateBalance,
  updateStartBalance,
} from '@/util'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { DB } from '@/database/db'
import { onBeforeUnmount } from 'vue'
import { getAllRecordsOfAccount } from '@/models/record'
import { deleteRecord } from '@/models/record'
import { createDebt } from '@/models/debt'

const state = useStateStore()
const stateRefs = storeToRefs(state)

const props = defineProps<{
  accounts: RelDocument<Account>[]
  categories: RelDocument<Category>[]
  labels: RelDocument<Label>[]
}>()

const records: Ref<RelDocument<Record>[]> = ref([])

const filters = [
  { days: 7 },
  { days: 30 },
  { weeks: 12 },
  { months: 6 },
  { years: 1 },
  { years: 5 },
].map((x) => Duration.fromObject(x))

const filter = defineModel({ default: 1 })

// DB sync

let changes: PouchDB.Core.Changes<{}> | null = null
const importantChanges = new Set(['record'])

function updateData() {
  if (state.activeWallet) {
    let accounts: ID[]
    if (state.shownAccounts.size === 0) {
      accounts = props.accounts.map((a) => a.id)
    } else {
      accounts = [...state.shownAccounts]
    }
    const now = DateTime.now()
    const filterDate = DateTime.now().minus(filters[filter.value]).toMillis()

    getAllRecordsOfAccountsByDate(
      accounts,
      filterDate,
      now.toMillis(),
      null,
      true,
      true,
      false
    )
      .then((res) => (records.value = res))
      .catch(console.error)
  }
}
const debouncedUpdateData = debounce(updateData, UPDATE_DATA_DEBOUNCE)

watch(stateRefs.activeWallet, (current, previous) => {
  if (current && current !== previous) {
    updateData()
  }
})

watch(
  () => props.accounts,
  (current, previous) => {
    if (current.length > 0 && current.length !== previous.length) {
      updateData()
    }
  }
)
watch(
  () => state.shownAccounts.size,

  updateData
)
watch(filter, updateData)

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

// TODO: remove test features below

function choose<T>(array: T[]): T {
  const index = Math.random() * array.length
  return array[Math.floor(index)]
}
function chooseMany<T>(array: T[], amount: number): T[] {
  const possibilities = [...array]
  if (amount >= array.length) {
    return possibilities
  }
  const results: T[] = new Array(amount)
  for (let i = 0; i < amount; ++i) {
    const index = Math.random() * possibilities.length
    results[i] = possibilities.splice(Math.floor(index), 1)[0]
  }
  return results
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

async function addTestData() {
  if (state.activeWallet) {
    try {
      const oldest: { [x: ID]: number } = {}
      for (let i = 0; i < 100; i++) {
        console.log(i)
        const accountId = choose(props.accounts).id
        const datetime = randomDate(new Date(2022, 0, 1), new Date()).valueOf()
        if (!oldest[accountId] || datetime < oldest[accountId]) {
          oldest[accountId] = datetime
        }
        await createRecord(
          accountId,
          choose(props.categories).id,
          chooseMany(
            props.labels,
            Math.round(Math.random() * props.labels.length)
          ).map((x) => x.id),
          null,
          null,
          +(Math.random() * 1000 - 500).toFixed(2),
          null,
          randomText(),
          datetime,
          // don't recompute monthlies and start balance to gain some perf
          false
        )
      }
      // update monthlies and start balance only once per account, manually
      for (const id in oldest) {
        await updateMonthlies(id, oldest[id])
        await updateBalance(id)
        await updateStartBalance(id)
      }
    } catch (e) {
      alert(e)
      console.error(e)
    }
  }
}
async function deleteAll() {
  try {
    for (const account of props.accounts) {
      let oldest = Infinity
      const records = await getAllRecordsOfAccount(account.id)
      for (const r of records) {
        if (r.datetime < oldest) {
          oldest = r.datetime
        }
        // don't recompute monthlies to gain some perf
        await deleteRecord(r.id, false)
      }
      // update monthlies only once, manually
      await updateMonthlies(account.id, oldest)
      await updateBalance(account.id)
    }
  } catch (e) {
    alert(e)
    console.error(e)
  }
}
async function importOldData(event: Event) {
  if (!state.activeWallet) {
    return
  }
  const files = (event.target as HTMLInputElement).files
  if (!files?.length) {
    return
  }
  try {
    const data = JSON.parse(await files[0].text())
    console.log(data)

    console.log('Importing accounts..')

    const accountMap: Map<string, string> = new Map()
    const accountStartBalanceMap: Map<string, number> = new Map()

    // accounts
    for (const account of data.Account) {
      const id = await createAccount(
        state.activeWallet,
        account.name,
        account.color,
        0,
        new Date().valueOf(),
        'CHF'
      )
      accountMap.set(account['_doc_id_rev'].split('::')[0], id)
      accountStartBalanceMap.set(id, account.initRefAmount / 100)
    }

    console.log('Importing labels..')

    const labelMap: Map<string, string> = new Map()

    // labels
    for (const label of data.HashTag) {
      const id = await createLabel(state.activeWallet, label.name, label.color)
      labelMap.set(label['_doc_id_rev'].split('::')[0], id)
    }

    console.log('Importing planned payments..')

    const plannedMap: Map<string, string> = new Map()

    // planned payments
    // for now, planned payments will be labels, so they can be converted again later
    for (const label of data.StandingOrder) {
      const id = await createLabel(
        state.activeWallet,
        label['_doc_id_rev'].split('::')[0],
        '#333333'
      )
      plannedMap.set(label['_doc_id_rev'].split('::')[0], id)
    }

    console.log('Importing categories..')

    const categoryMap: Map<string, string> = new Map()

    const existingCategories = await getAllCategoriesOfWallet(
      state.activeWallet
    )
    const existingCategoriesByName: Map<string, string> = new Map()
    existingCategories.forEach((cat) =>
      existingCategoriesByName.set(cat.name, cat.id)
    )

    // categories
    for (const category of data.Category) {
      const id = (() => {
        switch (category.name) {
          case 'Unknown Income':
            return existingCategoriesByName.get('Others')
          case 'OneClick':
            return existingCategoriesByName.get('Others')
          case 'Rentals':
            return existingCategoriesByName.get('Rentals')
          case '':
            return existingCategoriesByName.get('Others')
          case 'Inconnu(e)':
            return existingCategoriesByName.get('Others')
          case 'Allocations familiales':
            return existingCategoriesByName.get('Dues, grants')
          case 'Cadeaux in':
            return existingCategoriesByName.get('Gifts')
          case 'Charges, Fees':
            return existingCategoriesByName.get('Charges, Fees')
          case 'Assurance des véhicules':
            return existingCategoriesByName.get('Vehicle insurance')
          case 'Sport, remise en forme':
            return existingCategoriesByName.get('Active sport, fitness')
          case 'Dons':
            return existingCategoriesByName.get('Gifts')
          case 'Dette':
            return existingCategoriesByName.get('Loan, interests')
          case 'Pièces':
            return existingCategoriesByName.get('Vehicle maintenance')
          case 'Bijoux, accessoires':
            return existingCategoriesByName.get('Shopping')
          case 'Carburant':
            return existingCategoriesByName.get('Fuel, electricity')
          case 'Achats':
            return existingCategoriesByName.get('Shopping')
          case 'Vente':
            return existingCategoriesByName.get('Sale')
          case 'Événements de la vie':
            return existingCategoriesByName.get('Life events')
          case 'Véhicules, biens personnels':
            return existingCategoriesByName.get('Vehicles, chattels')
          case 'Économies':
            return existingCategoriesByName.get('Savings')
          case 'Liste de courses':
            return existingCategoriesByName.get('Groceries')
          case 'Remboursements (impôt, achat)':
            return existingCategoriesByName.get('Refunds (tax, purchase)')
          case 'Autres':
            return existingCategoriesByName.get('Others')
          case 'Prêt, location':
            return existingCategoriesByName.get('Lending, renting')
          case 'Taxes':
            return existingCategoriesByName.get('Taxes')
          case 'Amendes':
            return existingCategoriesByName.get('Fines')
          case 'Multimédia, PC':
            return existingCategoriesByName.get('Communication, PC')
          case 'Jeux vidéos':
            return existingCategoriesByName.get('Software, apps, games')
          case 'Vacances, voyages, hôtels':
            return existingCategoriesByName.get('Holiday, trips, hotels')
          case 'Entretien du véhicule':
            return existingCategoriesByName.get('Vehicle maintenance')
          case 'Revenu':
            return existingCategoriesByName.get('Income')
          case 'Bar, café':
            return existingCategoriesByName.get('Bar, cafe')
          case 'Logement':
            return existingCategoriesByName.get('Housing')
          case 'Cotisations & subventions':
            return existingCategoriesByName.get('Dues, grants')
          case 'Transports':
            return existingCategoriesByName.get('Transportation')
          case 'Vêtements & Chaussures':
            return existingCategoriesByName.get('Clothes, shoes')
          case 'Intérêts, dividendes':
            return existingCategoriesByName.get('Interests, dividends')
          case 'Cadeaux out':
            return existingCategoriesByName.get('Charity, gifts')
          case 'Education, development':
            return existingCategoriesByName.get('Education, development')
          case 'Énergie, services publics':
            return existingCategoriesByName.get('Energy, utilities')
          case 'Longue distance':
            return existingCategoriesByName.get('Long distance')
          case 'Unknown Expense':
            return existingCategoriesByName.get('Others')
          case 'Logiciels, applications, jeux':
            return existingCategoriesByName.get('Software, apps, games')
          case 'Loisirs':
            return existingCategoriesByName.get('Life, entertainement')
          case 'Frais financiers':
            return existingCategoriesByName.get('Financial expenses')
          case 'Investissements':
            return existingCategoriesByName.get('Investments')
          case 'Soins de santé, médecin':
            return existingCategoriesByName.get('Health care, doctor')
          case 'Alimentation':
            return existingCategoriesByName.get('Groceries')
          case 'Prêt, intérêts':
            return existingCategoriesByName.get('Loan, interests')
          case 'Transférer':
            return existingCategoriesByName.get('Others')
          case 'Transports en commun':
            return existingCategoriesByName.get('Public transport')
          case 'Nourritures & Boissons':
            return existingCategoriesByName.get('Food, drinks')
          case 'Crédit-bail':
            return existingCategoriesByName.get('Leasing')
          case 'Bien-être, beauté':
            return existingCategoriesByName.get('Wellness, beauty')
          case 'Papeterie':
            return existingCategoriesByName.get('Stationery, tools')
          case 'Électroniques, accessoires':
            return existingCategoriesByName.get('Electronics, accessories')
          case 'Hobbies, passions':
            return existingCategoriesByName.get('Hobbies')
          case 'Véhicule':
            return existingCategoriesByName.get('Vehicle')
          case 'Internet':
            return existingCategoriesByName.get('Internet')
          case 'Parking':
            return existingCategoriesByName.get('Parking')
          case 'Salaires, factures':
            return existingCategoriesByName.get('Wage, invoices')
          case 'Livres, audio, abonnements':
            return existingCategoriesByName.get('Books, audio, subscriptions')
          case 'Maison, Jardin':
            return existingCategoriesByName.get('Home, garden')
          case 'Téléphone, téléphone portable':
            return existingCategoriesByName.get('Phone, cell phone')
          case 'Outils':
            return existingCategoriesByName.get('Stationery, tools')
          case 'Animaux de compagnie':
            return existingCategoriesByName.get('Pets, animals')
          case 'Restaurant, fast food':
            return existingCategoriesByName.get('Restaurant, fast-food')
          case 'Culture, sport events':
            return existingCategoriesByName.get('Culture, sport events')
          case 'Drug-store, chemist':
            return existingCategoriesByName.get('Health care, doctor')
          case 'Electricity':
            return existingCategoriesByName.get('Energy, utilities')
          case 'Insurances':
            return existingCategoriesByName.get('Insurances')
          case 'Health and beauty':
            return existingCategoriesByName.get('Wellness, beauty')
          case 'Automatic bank statements reading':
            return existingCategoriesByName.get('Others')
          default:
            return existingCategoriesByName.get('Others')
        }
      })()
      if (id) {
        categoryMap.set(category['_doc_id_rev'].split('::')[0], id)
      } else {
        console.warn('Could not find corresponding category for', category)
      }
    }

    console.log('Importing debts..')

    const debtMap: Map<string, string> = new Map()

    // debts
    for (const debt of data.Debt) {
      const id = await createDebt(
        state.activeWallet,
        debt.remainingAmount / 100,
        debt.name,
        debt.note || null
      )
      debtMap.set(debt['_doc_id_rev'].split('::')[0], id)
    }

    console.log('Importing records..')

    const oldest: { [x: ID]: number } = {}
    const transferMap: Map<string, string> = new Map()

    // records
    for (const record of data.Record) {
      if (record._deleted) {
        continue
      }
      const accountId = accountMap.get(record.accountId)
      if (!accountId) {
        console.warn('Could not map account for', record)
        continue
      }
      const categoryId = categoryMap.get(record.categoryId)
      if (!categoryId) {
        console.warn('Could not map category for', record)
        continue
      }
      // labels can be missing
      const labelIds = record.labels
        ? (record.labels as string[])
            .map((l) => labelMap.get(l))
            .filter((x) => x !== undefined)
        : []

      // detect planned payments and add to labels for now
      // detect debt
      let debtId = null
      if (record.refObjects) {
        // refObjects can be missing
        ;(record.refObjects as any[]).forEach((ref) => {
          if (ref.id.startsWith('-StandingOrder_')) {
            const l = plannedMap.get(ref.id)
            if (l) {
              labelIds.push(l)
            } else {
              console.warn(
                'Could not map planned payment label for',
                record,
                ref
              )
            }
          } else if (ref.id.startsWith('-Debt_')) {
            const d = debtMap.get(ref.id)
            if (d) {
              debtId = d
            } else {
              console.warn('Could not map debt for', record, ref)
            }
          }
        })
      }

      let transferId = null

      // detect transfer
      if (record.transfer) {
        transferId = transferMap.get(record.transferId) || null
      }

      const datetime = DateTime.fromISO(record.recordDate).toMillis()

      if (!oldest[accountId] || datetime < oldest[accountId]) {
        oldest[accountId] = datetime
      }

      const id = await createRecord(
        accountId,
        categoryId,
        labelIds,
        debtId,
        transferId,
        (record.refAmount / 100) * (record.type === 0 ? 1 : -1),
        record.payee || null,
        record.note || null,
        datetime,
        false
      )

      if (record.transfer) {
        if (!transferId) {
          // if this was a transfer but we don't have the other side yet, store this one
          transferMap.set(record.transferId, id)
        } else {
          // otherwise, this was the second, update the first
          const other = await getRecord(transferId)
          if (other) {
            await updateRecord(
              transferId,
              other.accountId,
              other.categoryId,
              other.labelIds,
              id,
              other.value,
              other.payee,
              other.description,
              other.datetime
            )
          } else {
            console.warn('Failed to find corresponding transfer for', record)
          }
          transferMap.delete(record.transferId)
        }
      }
    }

    console.log('Updating precomputed values...')

    // update monthlies and start balance only once per account, manually
    for (const id in oldest) {
      console.log('- Updating monthlies...', id)
      await updateMonthlies(id, oldest[id])
      console.log('- Updating balance', id)
      await updateBalance(id)
      console.log('- Updating start balance', id)
      await updateStartBalance(id)
      // update start balance now that we have the correct start balance date
      console.log('- Setting start balance', id)
      const account = await getAccount(id)

      if (!account) {
        continue
      }
      await updateAccount(
        id,
        account.name,
        account.color,
        account.balance,
        accountStartBalanceMap.get(id) || 0,
        account.startBalanceDate,
        account.currency
      )
    }

    console.log('Import finished')

    // TODO: leftover transfers are likely "from outside"/"to outside"
    console.log('Leftover transfers', transferMap)

    // TODO: delete debts with 0 records (probably the records were all deleted)
  } catch (e) {
    console.error('Import failed', e)
  }
}
</script>

<template>
  <div class="mx-4 flex items-center justify-between">
    <h2 class="text-lg font-medium">
      {{ $t('widgets.records.title', 2) }} ({{
        filters[filter].reconfigure({ locale: $i18n.locale }).toHuman()
      }})
    </h2>
    <FormKit type="select" name="filter" v-model="filter" validation="required">
      <option v-for="(f, index) in filters" :key="index" :value="index">
        {{ f.reconfigure({ locale: $i18n.locale }).toHuman() }}
      </option>
    </FormKit>
  </div>
  <RecordList
    class="m-2"
    :accounts="accounts"
    :categories="categories"
    :labels="labels"
    :records="records"
  ></RecordList>
  <div class="flex flex-wrap justify-center gap-4 print:hidden">
    <button
      class="nt-button wallet-secondary flex items-center px-4"
      @click="addTestData()"
    >
      <i class="material-icons pr-2">data_object</i>
      Add test data
    </button>
    <button
      class="nt-button wallet-secondary flex items-center px-4"
      @click="deleteAll()"
    >
      <i class="material-icons pr-2">data_object</i>
      Delete all records in active Wallet
    </button>
    <label
      for="import-old"
      class="nt-button wallet-secondary flex cursor-pointer items-center px-4"
    >
      <input
        type="file"
        accept=".json"
        id="import-old"
        name="import-old"
        hidden
        @input="importOldData($event)"
      />
      <i class="material-icons pr-2">data_object</i>
      Import old data
    </label>
  </div>
</template>

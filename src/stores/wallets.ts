import { defineStore } from 'pinia'
import type { Wallet } from '@/models/wallet'
import type { Account, Currency } from '@/models/account'
import type { Monthly } from '@/models/monthly'
import type { Record } from '@/models/record'
import { deleteById, type UUID } from '@/models/common'
import { ref, type Ref } from 'vue'

export const useWalletsStore = defineStore('wallets', () => {
  const wallets: Ref<Wallet[]> = ref([])
  const accounts: Ref<Account[]> = ref([])
  const records: Ref<Record[]> = ref([])
  const monthly: Ref<Monthly[]> = ref([])

  function updateBalance(accountId: UUID) {
    const account = accounts.value.find((a) => a.id === accountId)
    if (account) {
      // TODO: use monthlies to optimize computation of balance
      // recompute all monthlies after the modified record, then use the last monthly and the remaining records to compute balance
      const accountRecords = records.value.filter(
        (r) => r.accountId === accountId
      )
      account.balance =
        Math.round(
          accountRecords.reduce(
            (balance, r) => balance + r.value,
            account.startBalance
          ) * 100
        ) / 100
    }
  }

  /**
   * Create a new Wallet, save it in the store and return it
   * @param name Name of the new Wallet
   * @returns The new Wallet
   */
  function createWallet(name: string) {
    const now = new Date()
    const newWallet = {
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: new Date(now),
    } as Wallet
    wallets.value.push(newWallet)
    return newWallet
  }
  function updateWallet(wallet: Wallet, name: string) {
    const now = new Date()
    wallet.name = name
    wallet.updatedAt = now
  }
  function deleteWallet(id: UUID) {
    // Delete associated accounts and records
    accounts.value
      .filter((a) => a.walletId === id)
      .forEach((a) => deleteAccount(a.id))
    // Delete the wallet
    deleteById(wallets.value, id)
  }

  /**
   * Create a new Account, save it in the store and return it
   * @param walletId ID of the Wallet to associate with
   * @param name Name of the new Account
   * @param color Display color of the new Account as a HEX string
   * @param currency Currency of the new Account
   * @returns The new Account
   */
  function createAccount(
    walletId: UUID,
    name: string,
    color: string,
    currency: Currency
  ) {
    const now = new Date()
    const newAccount = {
      id: crypto.randomUUID(),
      walletId,
      name,
      color,
      balance: 0,
      // TODO: make this a parameter
      startBalance: 0,
      currency,
      createdAt: now,
      updatedAt: new Date(now),
    } as Account
    accounts.value.push(newAccount)
    return newAccount
  }
  function updateAccount(
    account: Account,
    name: string,
    color: string,
    currency: Currency
  ) {
    const now = new Date()
    account.name = name
    account.color = color
    account.currency = currency
    account.updatedAt = now
  }
  function deleteAccount(id: UUID) {
    // Delete associated records
    records.value = records.value.filter((r) => r.accountId !== id)
    // Delete the account
    deleteById(accounts.value, id)
  }

  /**
   * Create a new Record, save it in the store and return it
   * @param accountId ID of the Account to associate with
   * @param value Value of the new Record
   * @param payee Name of the payee of the new Record
   * @param description Description of the new Record
   * @param datetime Date and time at which the new Record was established
   * @returns The new Record
   */
  function createRecord(
    accountId: UUID,
    value: number,
    payee: string | null,
    description: string | null,
    datetime: Date
  ) {
    const now = new Date()
    const newRecord = {
      id: crypto.randomUUID(),
      accountId,
      value,
      payee,
      description,
      datetime,
      createdAt: now,
      updatedAt: new Date(now),
    } as Record
    records.value.push(newRecord)
    updateBalance(accountId)
    return newRecord
  }
  function deleteRecord(id: UUID) {
    const recordIndex = records.value.findIndex((r) => r.id === id)
    const accountId = records.value[recordIndex].accountId
    records.value.splice(recordIndex, 1)
    updateBalance(accountId)
  }

  return {
    wallets,
    accounts,
    records,
    monthly,
    createWallet,
    updateWallet,
    deleteWallet,
    createAccount,
    updateAccount,
    deleteAccount,
    createRecord,
    deleteRecord,
    /**
     * See localStoragePlugin
     */
    persist: true,
  }
})

import { DateTime, type DateObjectUnits } from 'luxon'
import { getAccount, updateAccount } from './models/account'
import type { ID } from './models/common'
import {
  getAllRecordsOfAccountsByDate,
  getAllRecordsOfDebt,
} from './models/record'
import Color from 'colorjs.io'
import {
  createMonthly,
  getAllMonthliesOfAccountByDate,
  updateMonthly,
} from './models/monthly'
import { getDebt, updateDebt } from './models/debt'

/**
 * In case better UTF16/Locales support is needed, see https://stackoverflow.com/a/53930826
 */
export function capitalizeFirstLetter(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

const MONTH_START: DateObjectUnits = {
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0,
}

export async function updateBalance(accountId: ID) {
  const currentMonthStart = DateTime.utc().set(MONTH_START).toMillis()
  const account = await getAccount(accountId)
  if (account) {
    const lastMonthly = await getAllMonthliesOfAccountByDate(
      accountId,
      currentMonthStart,
      currentMonthStart,
      1,
      true,
      true
    )

    const startBalance = lastMonthly[0]?.balance || 0

    const records = await getAllRecordsOfAccountsByDate(
      [accountId],
      currentMonthStart,
      new Date().valueOf(),
      null,
      true,
      true
    )

    const finalBalance = to2DecimalNumber(
      records.reduce((balance, r) => balance + r.value, startBalance)
    )

    return updateAccount(
      accountId,
      account.name,
      account.color,
      finalBalance,
      account.startBalance,
      account.startBalanceDate,
      account.currency
    )
  }
}

export async function updateStartBalance(accountId: ID) {
  const account = await getAccount(accountId)
  if (account) {
    // get all records in account before the startBalanceDate
    const records = await getAllRecordsOfAccountsByDate(
      [accountId],
      null,
      account.startBalanceDate
    )

    if (records?.length > 0) {
      const oldestRecord = records[0]

      const startBalance = to2DecimalNumber(
        records.reduce((balance, r) => balance - r.value, account.startBalance)
      )

      // TODO: make this visible in UI
      console.log(`Updated ${account.name}'s start balance`)

      return updateAccount(
        accountId,
        account.name,
        account.color,
        account.balance,
        startBalance,
        oldestRecord.datetime,
        account.currency
      )
    }
  }
}

export async function updateDebtBalance(debtId: ID) {
  const debt = await getDebt(debtId)

  if (!debt) {
    return
  }

  const records = await getAllRecordsOfDebt(debtId)

  const finalBalance = to2DecimalNumber(
    records.reduce((balance, r) => balance + r.value, 0)
  )

  const closed = finalBalance === 0

  return updateDebt(debtId, finalBalance, debt.payee, debt.description, closed)
}

/**
 * Recomputes the monthlies starting from the month that contains `dateChanged`
 * @param dateChanged Unix EPOCH at which some record changed, prompting the recompute of monthlies
 */
export async function updateMonthlies(accountId: ID, dateChanged: number) {
  const currentMonthStart = DateTime.utc().set(MONTH_START)

  // monthlies are always stored at UTC start of months
  // They represent the balance of the account at the end of the previous month (ie the sum of all records up to but not including their `datetime` value)
  let start = DateTime.fromMillis(dateChanged, { zone: 'UTC' }).set(MONTH_START)

  while (!start.equals(currentMonthStart)) {
    // recompute monthly then move to next month
    const end = start.plus({ month: 1 })
    const startMillis = start.toMillis()
    const endMillis = end.toMillis()

    // we expect this request to return between 0 and 2 values
    const monthlies = await getAllMonthliesOfAccountByDate(
      accountId,
      startMillis,
      endMillis,
      null,
      true,
      true
    )
    // check if there exists a monthly for the "previous" month (the base to compute the current one)
    const previousMonthly = monthlies.find((m) => m.datetime === startMillis)
    // as well as for the "current" month
    const currentMonthly = monthlies.find((m) => m.datetime === endMillis)
    // if the monthly doesn't exist, if we consider the DB to be consistant, that means this is the first month (there is no data before this)
    const baseBalance = previousMonthly?.balance || 0

    // compute this monthly's sum
    const records = await getAllRecordsOfAccountsByDate(
      [accountId],
      startMillis,
      endMillis
    )

    const monthlyBalance = to2DecimalNumber(
      records.reduce((balance, r) => balance + r.value, baseBalance)
    )

    // attempt to update an existing monthly. otherwise, create it
    if (currentMonthly) {
      await updateMonthly(currentMonthly.id, monthlyBalance)
    } else {
      await createMonthly(accountId, monthlyBalance, endMillis)
    }
    // OPTIMIZE: the result from above will be the `previousMonthly` of the next iteration
    // we could optimize by storing it outside the loop
    // but we need to perform `getAllMonthliesOfAccountByDate` anyways, so not sure how much perf we gain

    start = end
  }
  // no monthly is computed for the running month. we are done
  // TODO: there should be a way to detect that a monthly is not needed anymore (when we delete the last record of a month). right now we have some leftovers in the DB, but that's not too bad
}

export function debounce(func: Function, wait: number) {
  let timeout: number | undefined = undefined
  return function (this: any) {
    const context = this
    const args = arguments
    var later = () => {
      timeout = undefined
      func.apply(context, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait) as unknown as number
  }
}

const black = new Color('black')
const white = new Color('white')

// OPTIMIZE: could cache this. TBD if useful
export function useBlackText(backgroundColor: string) {
  const background = new Color(backgroundColor)
  const cBlack = background.contrast(black, 'APCA')
  const cWhite = background.contrast(white, 'APCA')
  return Math.abs(cBlack) > Math.abs(cWhite)
}

export function to2DecimalNumber(input: string | number) {
  return Math.round(parseFloat(input as string) * 100) / 100
}

import { getAccount, updateAccount } from './models/account'
import type { ID } from './models/common'
import { getAllRecordsOfAccount } from './models/record'

export async function updateBalance(accountId: ID) {
  const account = await getAccount(accountId)
  if (account) {
    // TODO: use monthlies to optimize computation of balance
    // recompute all monthlies after the modified record, then use the last monthly and the remaining records to compute balance
    const accountRecords = await getAllRecordsOfAccount(accountId)
    const balance =
      Math.round(
        accountRecords.reduce(
          (balance, r) => balance + r.value,
          account.startBalance
        ) * 100
      ) / 100
    return updateAccount(
      accountId,
      account.name,
      account.color,
      balance,
      account.currency
    )
  }
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

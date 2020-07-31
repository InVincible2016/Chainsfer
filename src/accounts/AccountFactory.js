// @flow

import type { AccountData, IAccount } from '../types/account.flow.js'
import BitcoinAccount from './BitcoinAccount'
import EthereumAccount from './EthereumAccount'
import { erc20TokensList } from '../erc20Tokens'

export function createAccount (accountData: AccountData): IAccount {
  if (['bitcoin'].includes(accountData.cryptoType)) {
    return new BitcoinAccount(accountData)
  } else {
    return new EthereumAccount(accountData)
  }
}

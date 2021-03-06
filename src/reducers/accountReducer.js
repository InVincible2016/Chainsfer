import update from 'immutability-helper'
/*
 *  Handle accounts
 */

const initState = {
  escrowAccount: null,
  cryptoAccounts: [],
  newCryptoAccountsFromWallet: [],
  ethContracts: null,
  ethContractsExpiry: 0
}

/*
 * @param overwriteExisting Solving key collision using the newCryptoAccounts
 * @param remove Deleting the account if the acount is not found in newCryptoAccounts
 * @param addition if newCryptoAccounts does not already in exist, add it to state
 */
function updateCryptoAccount (
  state,
  newCryptoAccounts,
  remove = false,
  overwriteExisting = true,
  addition = true
) {
  let cryptoAccountMap = {}
  let newCryptoAccountMap = {}
  let accounts = []
  const { cryptoAccounts } = state

  const accountToId = account => account.id

  if (!Array.isArray(newCryptoAccounts)) {
    const newCryptoAccount = newCryptoAccounts
    if (newCryptoAccount.walletType === 'escrow') {
      return update(state, { escrowAccount: { $set: newCryptoAccount } })
    }
    // convert to array when necessary
    newCryptoAccounts = [newCryptoAccounts]
  }

  cryptoAccounts.forEach((account, idx) => {
    cryptoAccountMap[accountToId(account)] = { idx, account }
  })

  newCryptoAccounts.forEach((account, idx) => {
    newCryptoAccountMap[accountToId(account)] = { idx, account }
  })

  cryptoAccounts.forEach((account, idx) => {
    const id = accountToId(account)
    if (id in newCryptoAccountMap) {
      if (overwriteExisting) {
        // Solving key collision using the newCryptoAccounts
        accounts.push({ ...account, ...newCryptoAccountMap[id].account })
      } else {
        accounts.push({
          ...newCryptoAccountMap[id].account,
          ...account,
          // name could be updated after synced
          name: newCryptoAccountMap[id].account.name
        })
      }
    } else if (!remove) {
      // account not found in newCryptoAccounts
      // do not remove existing account
      accounts.push(account)
    }
  })

  // append new accounts
  newCryptoAccounts.forEach(account => {
    const id = accountToId(account)
    if (!(id in cryptoAccountMap) && addition) {
      accounts.push(account)
    }
  })

  return update(state, { cryptoAccounts: { $set: accounts } })
}

export default function (state = initState, action) {
  switch (action.type) {
    // following three actions return a complete list of accounts after actions
    case 'GET_CRYPTO_ACCOUNTS_FULFILLED':
    case 'REMOVE_CRYPTO_ACCOUNTS_FULFILLED':
    case 'MODIFY_CRYPTO_ACCOUNTS_NAME_FULFILLED':
      return updateCryptoAccount(state, action.payload, true, false)
    case 'ADD_CRYPTO_ACCOUNTS_FULFILLED':
      // this action returns { cryptoAccounts, reward }
      return updateCryptoAccount(state, action.payload.cryptoAccounts, true, false)
    case 'MARK_ACCOUNT_DIRTY':
    case 'SYNC_WITH_NETWORK_FULFILLED':
    case 'VERIFY_ACCOUNT_FULFILLED':
    case 'CLEAR_ACCOUNT_PRIVATE_KEY':
    case 'POST_TX_ACCOUNT_CLEAN_UP':
      return updateCryptoAccount(state, action.payload)
    // CHECK_WALLET_CONNECTION_FULFILLED should not add new account to redux
    // if such account does not exist
    case 'CHECK_WALLET_CONNECTION_FULFILLED':
      return updateCryptoAccount(state, action.payload, false, true, false)
    case 'SYNC_WITH_NETWORK_PENDING':
      return updateCryptoAccount(state, action.meta)
    case 'GET_TRANSFER_FULFILLED':
      return updateCryptoAccount(state, action.payload.escrowAccount)
    case 'NEW_CRYPTO_ACCOUNTS_FROM_WALLET_FULFILLED':
      return update(state, { newCryptoAccountsFromWallet: { $set: action.payload } })
    case 'VERIFY_ESCROW_ACCOUNT_PASSWORD_FULFILLED':
      return updateCryptoAccount(state, action.payload)
    case 'GET_ALL_ETH_CONTRACTS_FULFILLED': {
      let ethContracts = {}
      action.payload.forEach(contract => {
        ethContracts[contract.cryptoType] = contract
      })
      const ethContractsExpiry = Math.round(new Date().getTime() / 1000) + 24 * 60 * 60 // 24hrs
      return {
        ...state,
        ethContracts: ethContracts,
        ethContractsExpiry: ethContractsExpiry
      }
    }
    default:
      // need this for default case
      return state
  }
}

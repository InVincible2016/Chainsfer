import Web3 from 'web3'
import LedgerNanoS from '../ledgerSigner'
import utils from '../utils'
import { goToStep } from './navigationActions'
import { Base64 } from 'js-base64'
import { getTransferData } from '../drive.js'
import ERC20 from '../ERC20'

const ledgerNanoS = new LedgerNanoS()

function syncLedgerAccountInfo (cryptoType, accountIndex = 0) {
  return {
    type: 'SYNC_LEDGER_ACCOUNT_INFO',
    payload: ledgerNanoS.syncAccountBaseOnCryptoType(cryptoType, accountIndex)
  }
}

async function _checkMetamaskConnection (cryptoType, dispatch) {
  let rv = {
    connected: false,
    network: null,
    crypto: null
  }

  if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
    rv.connected = true
    rv.network = window.ethereum.networkVersion

    window._web3 = new Web3(window.ethereum)

    // request the user logs in
    rv.crypto = {}

    let addresses = await window.ethereum.enable()
    if (addresses) {
      for (let i = 0; i < addresses.length; i++) {
        rv.crypto = {
          [cryptoType]: {
            [i]: {
              address: addresses[i],
              balance: cryptoType === 'ethereum' ? await window._web3.eth.getBalance(addresses[i]) : await ERC20.getBalance(addresses[i], cryptoType)
            }
          }
        }
      }
    }

    // listen for accounts changes
    window.ethereum.on('accountsChanged', function (accounts) {
      dispatch(onMetamaskAccountsChanged(accounts))
    })
  }
  return rv
}

async function _checkLedgerNanoSConnection (cryptoType) {
  const deviceConnected = await ledgerNanoS.deviceConnected(cryptoType)
  if (deviceConnected === null) {
    const msg = 'Ledger not connected'
    throw msg
  }
  return deviceConnected
}

async function _verifyPassword (sendingId, encriptedWallet, password) {
  if (sendingId) {
    // retrieve password from drive
    let transferData = await getTransferData(sendingId)
    password = Base64.decode(transferData.password) + transferData.destination
  }

  let decryptedWallet = utils.decryptWallet(encriptedWallet, password)
  if (!decryptedWallet) {
    // wrong password
    throw new Error('WALLET_DECRYPTION_FAILED')
  }
  return decryptedWallet
}

function checkMetamaskConnection (crypoType) {
  return (dispatch, getState) => {
    return dispatch({
      type: 'CHECK_METAMASK_CONNECTION',
      payload: _checkMetamaskConnection(crypoType, dispatch)
    })
  }
}

function onMetamaskAccountsChanged (accounts) {
  return {
    type: 'UPDATE_METAMASK_ACCOUNTS',
    payload: accounts
  }
}

function checkLedgerNanoSConnection (cryptoType) {
  return {
    type: 'CHECK_LEDGER_NANOS_CONNECTION',
    payload: _checkLedgerNanoSConnection(cryptoType)
  }
}

function verifyPassword (sendingId, encriptedWallet, password, nextStep) {
  return (dispatch, getState) => {
    return dispatch({
      type: 'VERIFY_PASSWORD',
      payload: _verifyPassword(sendingId, encriptedWallet, password)
    }).then(() => {
      if (nextStep) {
        return dispatch(goToStep(nextStep.transferAction, nextStep.n))
      }
    }).catch(error => {
      console.warn(error)
    })
  }
}

function clearDecryptedWallet () {
  return {
    type: 'CLEAR_DECRYPTED_WALLET'
  }
}

// TODO cloud wallet actions
function getWallet () {
  return {
    type: 'GET_WALLET'
  }
}

export {
  checkMetamaskConnection,
  onMetamaskAccountsChanged,
  checkLedgerNanoSConnection,
  verifyPassword,
  clearDecryptedWallet,
  getWallet,
  syncLedgerAccountInfo
}

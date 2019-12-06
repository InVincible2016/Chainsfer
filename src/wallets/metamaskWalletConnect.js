// @flow
import type { IWallet } from '../types/wallet.flow.js'
import type { IAccount, AccountData } from '../types/account.flow.js'
import type { TxFee, TxHash, Signature } from '../types/transfer.flow'
import type { BasicTokenUnit, Address } from '../types/token.flow'

import EthereumAccount from '../accounts/EthereumAccount.js'
import WalletConnect from '@walletconnect/browser'
import WalletConnectQRCodeModal from '@walletconnect/qrcode-modal'
import WalletUtils from './utils.js'
import WalletErrors from './walletErrors'

const metamaskWalletConnectErrors = WalletErrors.metamaskWalletConnect
const DEFAULT_ACCOUNT = 0

export default class MetamaskWalletConnect implements IWallet<AccountData> {
  WALLET_TYPE = 'metamaskWalletConnect'
  account: IAccount

  constructor (accountData?: AccountData) {
    // Create a walletConnector
    if (!window.walletConnector) {
      window.walletConnector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org' // Required
      })
    }
    this._subscribeToWalletConnectEvents()

    if (accountData && accountData.cryptoType) {
      switch (accountData.cryptoType) {
        case 'dai':
        case 'ethereum':
          this.account = new EthereumAccount(accountData)
          break
        default:
          throw new Error('Invalid crypto type')
      }
    }
  }

  getAccount = (): IAccount => {
    if (!this.account) {
      throw new Error('Account is undefined')
    }
    return this.account
  }

  _getMetamaskWalletConnectAddresses = async (additionalInfo: ?Object) => {
    if (window.walletConnector.connected) {
      return window.walletConnector.accounts
    } else {
      const _newConnector = await this._CreateWalletConnectSession()
      return _newConnector.accounts
    }
  }

  _newEthereumAccount = async (
    name: string,
    cryptoType: string,
    options?: Object
  ): Promise<EthereumAccount> => {
    const addresses = await this._getMetamaskWalletConnectAddresses()
    const accountData = {
      cryptoType: cryptoType,
      walletType: this.WALLET_TYPE,

      address: addresses[0],
      name: name, // the name of this account set by the user.

      // token balance for erc20 tokens/
      balance: '0',
      balanceInStandardUnit: '0',

      // eth balance only
      ethBalance: '0',

      connected: true,
      verified: true,
      receivable: true,
      sendable: true,

      lastSynced: 0
    }

    this.account = new EthereumAccount(accountData)
    return this.account
  }

  async newAccount (name: string, cryptoType: string, options?: Object): Promise<IAccount> {
    if (['dai', 'ethereum'].includes(cryptoType)) {
      return this._newEthereumAccount(name, cryptoType, options)
    } else {
      throw new Error('Invalid crypto type')
    }
  }

  checkWalletConnection = async (additionalInfo: ?Object): Promise<boolean> => {
    const account = this.getAccount()
    const accountData = account.getAccountData()
    if (!window.walletConnector) {
      return false
    }

    // If connection is already established
    if (window.walletConnector.connected) {
      const { accounts } = window.walletConnector
      if (accounts[DEFAULT_ACCOUNT] !== accountData.address) {
        await this._resetWalletConnectSession()
      }
    }
    return true
  }

  _QRCodeModalPromise = (): Promise<Object> => {
    const uri = window.walletConnector.uri
    return new Promise((resolve, reject) => {
      WalletConnectQRCodeModal.open(uri, () => {
        console.info('QR Code Modal closed')
        reject(new Error(metamaskWalletConnectErrors.modalClosed))
      })

      window.walletConnector.on('connect', (error, payload) => {
        if (error) {
          throw error
        }
        // Close QR Code Modal
        WalletConnectQRCodeModal.close()
        resolve(window.walletConnector)
      })
    })
  }

  verifyAccount = async (additionalInfo: ?Object): Promise<boolean> => {
    let accountData = this.getAccount().getAccountData()

    const metamaskAddresses = await this._getMetamaskWalletConnectAddresses(additionalInfo)
    if (metamaskAddresses[DEFAULT_ACCOUNT].toLowerCase() === accountData.address.toLowerCase()) {
      this.account.accountData.connected = true
      this.account.accountData.verified = true
      return this.account.accountData.connected
    } else {
      this.account.accountData.connected = false
      throw new Error(metamaskWalletConnectErrors.incorrectAccount)
    }
  }

  sendTransaction = async ({
    to,
    value,
    txFee,
    options
  }: {
    to: Address,
    value: BasicTokenUnit,
    txFee: TxFee,
    options?: Object
  }): Promise<{ txHash?: TxHash, clientSig?: Signature }> => {
    const account = this.getAccount()
    const accountData = account.getAccountData()

    if (!accountData.connected) {
      throw new Error('Must connect and verify account first')
    }

    if (!options) throw new Error(metamaskWalletConnectErrors.noOptions)
    const { multisig } = options
    const txObj = multisig.getSendToEscrowTxObj(
      accountData.address,
      to,
      value,
      accountData.cryptoType
    )

    return { txHash: await window.walletConnector.sendTransaction(txObj) }
  }

  getTxFee = async ({
    value,
    options
  }: {
    value: BasicTokenUnit,
    options?: Object
  }): Promise<TxFee> => {
    const accountData = this.getAccount().getAccountData()
    return WalletUtils.getTxFee({
      value,
      cryptoType: accountData.cryptoType,
      directTransfer: !!options && options.directTransfer
    })
  }

  _CreateWalletConnectSession = async (): Promise<any> => {
    // create new session
    await window.walletConnector.createSession()
    // display QR Code modal
    const _newConnector = await this._QRCodeModalPromise()
    return _newConnector
  }

  _resetWalletConnectSession = async () => {
    if (window.walletConnector && window.walletConnector.connected) {
      await window.walletConnector.killSession()
    }
    window.walletConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org' // Required
    })
  }

  _subscribeToWalletConnectEvents = () => {
    window.walletConnector.on('session_update', (error, payload) => {
      if (error) {
        throw error
      }
      console.log('session_update', payload)
    })

    window.walletConnector.on('disconnect', (error, payload) => {
      if (error) {
        throw error
      }
      console.log('disconnect', payload)
      delete window.walletConnector
    })
  }
}

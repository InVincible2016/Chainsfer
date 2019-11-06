// @flow
import type { IWallet } from '../types/wallet.flow.js'
import type { IAccount, AccountData } from '../types/account.flow.js'
import type { TxFee, TxHash } from '../types/transfer.flow'
import type { BasicTokenUnit, Address } from '../types/token.flow'

import EthereumAccount from '../accounts/EthereumAccount.js'
import BitcoinAccount from '../accounts/BitcoinAccount.js'
import bitcoin from 'bitcoinjs-lib'
import Web3 from 'web3'
import * as bip32 from 'bip32'
import * as bip39 from 'bip39'

import ERC20 from '../ERC20'
import API from '../apis.js'
import url from '../url'
import env from '../typedEnv'
import utils from '../utils'
import { broadcastBtcRawTx, web3SendTransactions, buildEthereumTxObjs } from './utils.js'

const BASE_BTC_PATH = env.REACT_APP_BTC_PATH
const DEFAULTaccountData = 0
const NETWORK =
  env.REACT_APP_BTC_NETWORK === 'mainnet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet

export default class EscrowWallet implements IWallet<AccountData> {
  WALLET_TYPE = 'escrow'

  account: IAccount

  constructor (accountData?: AccountData) {
    if (accountData && accountData.cryptoType) {
      switch (accountData.cryptoType) {
        case 'dai':
        case 'ethereum':
          this.account = new EthereumAccount(accountData)
          break
        case 'bitcoin':
          this.account = new BitcoinAccount(accountData)
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

  _newEthereumAccount = async (
    name: string,
    cryptoType: string,
    options?: Object
  ): Promise<EthereumAccount> => {
    let _web3 = new Web3(new Web3.providers.HttpProvider(url.INFURA_API_URL))
    let web3Account = _web3.eth.accounts.create()
    const privateKey = web3Account.privateKey

    const accountData = {
      cryptoType: cryptoType,
      walletType: this.WALLET_TYPE,

      address: web3Account.address,
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

      privateKey: privateKey,
      lastSynced: 0
    }

    this.account = new EthereumAccount(accountData)
    return this.account
  }

  _newBitcoinAccount = (name: string): BitcoinAccount => {
    const seed = bip39.mnemonicToSeedSync(bip39.generateMnemonic())
    const root = bip32.fromSeed(seed, NETWORK)
    let xpriv = root.toBase58()
    const path = `m/${BASE_BTC_PATH}/${DEFAULTaccountData}'`
    const child = root.derivePath(path)
    const accountXPub = child.neutered().toBase58()
    const firstAddressNode = child.derive(0).derive(0)
    const firstAddressNodePrivateKey = firstAddressNode.toWIF()
    const { address } = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        // change = 0, addressIdx = 0
        pubkey: firstAddressNode.publicKey,
        network: NETWORK
      }),
      network: NETWORK
    })

    let accountData = {
      cryptoType: 'bitcoin',
      walletType: this.WALLET_TYPE,
      name: name,
      balance: '0',
      balanceInStandardUnit: '0',
      address: address,
      privateKey: firstAddressNodePrivateKey,
      hdWalletVariables: {
        xpriv: xpriv,
        xpub: accountXPub,
        nextAddressIndex: 0,
        nextChangeIndex: 0,
        changeAddress: address,
        addresses: [
          {
            address: address,
            path: env.REACT_APP_BTC_PATH + `/${DEFAULTaccountData}'/0/0`,
            utxos: []
          }
        ],
        lastBlockHeight: 0,
        lastUpdate: 0,
        endAddressIndex: 0,
        endChangeIndex: 0
      },
      verified: true,
      receivable: true,
      sendable: true,

      lastSynced: 0
    }

    this.account = new BitcoinAccount(accountData)
    return this.account
  }

  async newAccount (name: string, cryptoType: string, options?: Object): Promise<IAccount> {
    if (['dai', 'bitcoin', 'ethereum'].includes(cryptoType)) {
      if (cryptoType !== 'bitcoin') {
        return this._newEthereumAccount(name, cryptoType, options)
      } else {
        return this._newBitcoinAccount(name)
      }
    } else {
      throw new Error('Invalid crypto type')
    }
  }

  checkWalletConnection = async (additionalInfo: ?Object): Promise<boolean> => {
    let account = this.getAccount()
    let accountData = account.getAccountData()
    if (accountData.privateKey === undefined || accountData.privateKey === null) {
      if (additionalInfo && additionalInfo.password && accountData.encryptedPrivateKey) {
        try {
          await account.decryptAccount(additionalInfo.password)
          return true
        } catch (e) {
          console.error(e)
          return false
        }
      }
      return false
    }
    return true
  }

  verifyAccount = async (additionalInfo: ?Object): Promise<boolean> => {
    let accountData = this.getAccount().getAccountData()

    if (accountData.privateKey) {
      if (accountData.cryptoType === 'bitcoin') {
        const root = bip32.fromBase58(accountData.hdWalletVariables.xpriv, NETWORK)

        const path = `m/${BASE_BTC_PATH}/${DEFAULTaccountData}'`
        const child = root.derivePath(path)
        const accountXPub = child.neutered().toBase58()
        const firstAddressNode = child.derive(0).derive(0)
        const firstAddressNodePrivateKey = firstAddressNode.toWIF()
        if (firstAddressNodePrivateKey !== accountData.privateKey) {
          accountData.connected = false
          throw new Error('Account verification failed: Invalid Private Key')
        }
      } else if (['dai', 'ethereum'].includes(accountData.cryptoType)) {
        let _web3 = new Web3(new Web3.providers.HttpProvider(url.INFURA_API_URL))
        const web3Account = _web3.eth.accounts.privateKeyToAccount(accountData.privateKey)
        if (web3Account.address !== accountData.address) {
          accountData.connected = false
          throw new Error('Account verification failed: Invalid Private Key')
        }
      }
      accountData.verified = true
      accountData.connected = true
      return this.account.accountData.connected
    }
    accountData.verified = false
    throw new Error('Account verification failed: Private key is undefined')
  }

  sendTransaction = async ({
    to,
    value,
    txFee,
    options
  }: {
    to: Address,
    value: BasicTokenUnit,
    txFee?: TxFee,
    options?: Object
  }): Promise<TxHash | Array<TxHash>> => {
    const account = this.getAccount()
    const accountData = account.getAccountData()

    if (!accountData.connected) {
      throw new Error('Must connect and verify account first')
    }

    const { cryptoType } = accountData
    let txObjs: any = []
    if (!txFee) txFee = await account.getTxFee({ to, value, options: options })

    if (['dai', 'ethereum'].includes(cryptoType)) {
      const _web3 = new Web3(new Web3.providers.HttpProvider(url.INFURA_API_URL))
      txObjs = await buildEthereumTxObjs({
        cryptoType: cryptoType,
        value: value,
        from: accountData.address,
        to: to,
        txFee: txFee,
        options: options
      })
      // add privateKey to web3
      _web3.eth.accounts.wallet.add(accountData.privateKey)

      // convert decimal to hex
      for (let txObj of txObjs) {
        txObj.nonce = _web3.utils.toHex(txObj.nonce)
        txObj.value = _web3.utils.toHex(txObj.value)
        txObj.gas = _web3.utils.toHex(txObj.gas)
        txObj.gasPrice = _web3.utils.toHex(txObj.gasPrice)
      }
      return web3SendTransactions(_web3.eth.sendTransaction, txObjs)
    } else if (cryptoType === 'bitcoin') {
      const addressPool = accountData.hdWalletVariables.addresses
      const { fee, utxosCollected } = account._collectUtxos(addressPool, value, Number(txFee.price))
      const signedTxRaw = await this._xPrivSigner(
        utxosCollected,
        to,
        Number(value), // actual value to be sent
        Number(fee),
        account.hdWalletVariables.nextChangeIndex
      )
      return broadcastBtcRawTx(signedTxRaw)
    } else {
      throw new Error('Invalid crypto type')
    }
  }

  _xPrivSigner = (
    inputs: Array<Object>,
    to: string,
    // value to be sent
    satoshiValue: number,
    // total fee in satoshi
    fee: number,
    changeIndex: number
  ) => {
    // use the first account
    const accountData = this.getAccount().getAccountData()
    const keyPair = bitcoin.ECPair.fromWIF(accountData.privateKey, NETWORK)
    const p2wpkh = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: NETWORK
    })

    const { address } = bitcoin.payments.p2sh({
      redeem: p2wpkh,
      network: NETWORK
    })

    const p2sh = bitcoin.payments.p2sh({ redeem: p2wpkh, network: NETWORK })
    const txb = new bitcoin.TransactionBuilder(NETWORK)

    // add all inputs
    inputs.map(input => txb.addInput(input.txHash, input.outputIndex))

    // the actual "spend"
    txb.addOutput(to, satoshiValue)

    // change
    const inputValueTotal = inputs.reduce((total, input) => total + input.value, 0)
    const change = inputValueTotal - satoshiValue - fee
    txb.addOutput(address, change)

    // sign with first address's privateKey
    for (let i = 0; i < inputs.length; i++) {
      txb.sign(i, keyPair, p2sh.redeem.output, null, inputs[i].value)
    }

    const tx = txb.build()

    // return raw tx in hex
    return tx.toHex()
  }
}

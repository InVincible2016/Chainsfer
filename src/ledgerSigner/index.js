import 'babel-polyfill'
import Transport from '@ledgerhq/hw-transport-u2f' // for browser
import Ledger from '@ledgerhq/hw-app-eth'
import EthTx from 'ethereumjs-tx'
import Web3 from 'web3'
import BN from 'bn.js'
import {
  getSignTransactionObject,
  getBufferFromHex,
  calculateChainIdFromV,
  networkIdMap
} from './utils'
import BtcLedger from '@ledgerhq/hw-app-btc'
import { address, networks } from 'bitcoinjs-lib'
import axios from 'axios'
import moment from 'moment'

const baseEtherPath = "44'/60'/0'/0"
const baseBtcPath = "49'/1'"
const networkId = networkIdMap[process.env.REACT_APP_NETWORK_NAME]
const infuraApi = `https://${process.env.REACT_APP_NETWORK_NAME}.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`
const blockcypherBaseUrl = process.env.REACT_APP_BLOCKCYPHER_API_URL
const ledgerApiUrl = process.env.REACT_APP_LEDGER_API_URL

class LedgerNanoS {
  static transport
  static ethLedger
  static web3

  getTransport = async () => {
    if (!this.transport) {
      this.transport = await Transport.create()
    }
    return this.transport
  }

  getEtherLedger = async () => {
    if (!this.ethLedger) {
      this.ethLedger = new Ledger(await this.getTransport())
    }
    return this.ethLedger
  }

  getWeb3 = () => {
    if (!this.web3) {
      this.web3 = new Web3(new Web3.providers.HttpProvider(infuraApi))
    }
    return this.web3
  }

  getEthAddress = async (accountIndex) => {
    const accountPath = baseEtherPath + `/${accountIndex}`
    const ethLedger = await this.getEtherLedger()
    const result = await ethLedger.getAddress(accountPath)
    return result.address
  }

  getBtcAddresss = async (accountIndex) => {
    const btcLedger = await this.getBtcLedger()
    const accountPath = `${baseBtcPath}/${accountIndex}'/0/0`
    const addr = await btcLedger.getWalletPublicKey(accountPath, false, true)
    return addr
  }

  getBalance = async (cryptoType, accountIndex = 0) => {
    let balance
    switch (cryptoType) {
      case 'ethereum' || 'dai': // TODO: Get correct balance for ERC20 tokens
        const address = await this.getEthAddress(accountIndex)
        const web3 = this.getWeb3()
        balance = await web3.eth.getBalance(address)
        break
      case 'bitcoin':
        balance = await this.getTotaBtclBalance(accountIndex)
        break
      default:
        balance = 0
    }

    return new BN(balance)
  }

  getBtcLedger = async () => {
    if (!this.btcLedger) {
      this.btcLedger = new BtcLedger(await this.getTransport())
    }
    return this.btcLedger
  }

  syncAccountBaseOnCryptoType = async (cryptoType, accountIndex) => {
    switch (cryptoType) {
      case 'ethereum':
        return {
          address: await this.getEthAddress(0),
          balance: {
            ethereum: await this.getBalance(cryptoType, accountIndex)
          }
        }
      case 'dai':
        return {
          address: await this.getEthAddress(0),
          balance: {
            dai: await this.getBalance(cryptoType, accountIndex)
          }
        }
      case 'bitcoin':
        const account = await this.syncBtcAccountInfo(accountIndex)
        return account
      default:
        throw new Error('Ledger Wallet received invalid cryptoType')
    }
  }

  deviceConnected = async (cryptoType) => {
    try {
      if (cryptoType !== 'bitcoin') {
        await this.getEthAddress()
      } else {
        await this.getBtcAddresss()
      }
      return {
        connected: true,
        network: cryptoType === 'bitcoin' ? 'testnet' : networkIdMap[process.env.REACT_APP_NETWORK_NAME]
      }
    } catch (e) {
      console.log(e)
      return null
    }
  }

  /**
   * @param {number}      accountIndex        Index of sender account.
   * @param {string}      receipientAddr      Address of receipient.
   * @param {number}      amount              Amount of ether, in 'wei'.
   * @param {object}      options             Options of the transaction (i.e. gasLimit & gasPrice)
   */
  signSendEther = async (accountIndex, receipientAddr, amount, ...options) => {
    const accountPath = baseEtherPath + `/${accountIndex}`
    const web3 = this.getWeb3()
    const ethLedger = await this.getEtherLedger()
    const address = await this.getEthAddress(accountIndex)
    const txCount = await web3.eth.getTransactionCount(address)

    let gasPrice = web3.utils.toWei('20', 'Gwei') // default
    let gasLimit

    if (options[options.length - 1] && options[options.length - 1].gasPrice) {
      gasPrice = options[options.length - 1].gasPrice
    }
    if (options[options.length - 1] && options[options.length - 1].gasLimit) {
      gasLimit = options[options.length - 1].gasLimit
    }

    let rawTx = {
      from: address,
      nonce: txCount,
      gasPrice: web3.utils.numberToHex(gasPrice),
      to: receipientAddr,
      value: web3.utils.numberToHex(amount),
      data: ''
    }
    const gasNeeded = await web3.eth.estimateGas(rawTx)

    if (gasNeeded >= gasLimit) {
      console.error('Insufficient gas.')
    } else if (gasLimit === undefined) {
      gasLimit = gasNeeded
    }

    rawTx = {
      ...rawTx,
      gas: web3.utils.numberToHex(gasLimit)
    }

    let tx = new EthTx(rawTx)
    tx.raw[6] = Buffer.from([networkId])
    tx.raw[7] = Buffer.from([])
    tx.raw[8] = Buffer.from([])

    const rv = await ethLedger.signTransaction(
      accountPath,
      tx.serialize().toString('hex')
    )
    tx.v = getBufferFromHex(rv.v)
    tx.r = getBufferFromHex(rv.r)
    tx.s = getBufferFromHex(rv.s)

    const signedChainId = calculateChainIdFromV(tx.v)
    if (signedChainId !== networkId) {
      console.error(
        'Invalid networkId signature returned. Expected: ' +
        networkId +
        ', Got: ' +
        signedChainId,
        'InvalidNetworkId'
      )
    }

    const signedTransactionObject = getSignTransactionObject(tx)

    return signedTransactionObject
    // return web3.eth.sendSignedTransaction(signedTransactionObject.rawTransaction)
  }

  /**
   * @param {number}                        accountIndex        Index of sender account.
   * @param {string}                        contractAddress     Target contract address.
   * @param {object}                        contractAbi         Contract ABI.
   * @param {string}                        methodName          Name of the method being called.
   * @param {[param1[, param2[, ...]]]}     params              Paramaters for the contract. The last param is a optional object contains gasPrice and gasLimit.
   */
  signSendTrasaction = async (accountIndex, contractAddress, contractAbi, methodName, ...params) => {
    const accountPath = baseEtherPath + `/${accountIndex}`
    const web3 = this.getWeb3()
    const ethLedger = await this.getEtherLedger()
    const address = await this.getEthAddress(accountIndex)
    const txCount = await web3.eth.getTransactionCount(address)

    let gasPrice = web3.utils.toWei('20', 'Gwei') // default
    let gasLimit

    if (params[params.length - 1] && params[params.length - 1].gasPrice) {
      gasPrice = params[params.length - 1].gasPrice
    }
    if (params[params.length - 1] && params[params.length - 1].gasLimit) {
      gasLimit = params[params.length - 1].gasLimit
    }

    let functionParams = []
    if (['undefined', 'object'].indexOf(typeof params[params.length - 1]) >= 0) {
      console.log('no param')
    } else {
      params.forEach((item) => {
        if (['undefined', 'object'].indexOf(typeof item)) {
          functionParams.push(item)
        }
      })
    }
    const targetContract = new web3.eth.Contract(contractAbi, contractAddress)
    const data = targetContract.methods[methodName](...functionParams).encodeABI()
    const gasNeeded = await targetContract.methods[methodName](...functionParams).estimateGas({ from: address })

    if (gasNeeded >= gasLimit) {
      console.error('Insufficient gas set for transaction.')
    } else if (gasLimit === undefined) {
      gasLimit = gasNeeded
    }

    let rawTx = {
      from: address,
      nonce: txCount,
      gasPrice: web3.utils.numberToHex(gasPrice),
      gas: web3.utils.numberToHex(gasLimit),
      to: contractAddress,
      value: web3.utils.numberToHex(0),
      data: data
    }

    let tx = new EthTx(rawTx)
    tx.raw[6] = Buffer.from([networkId])
    tx.raw[7] = Buffer.from([])
    tx.raw[8] = Buffer.from([])

    const rv = await ethLedger.signTransaction(
      accountPath,
      tx.serialize().toString('hex')
    )
    tx.v = getBufferFromHex(rv.v)
    tx.r = getBufferFromHex(rv.r)
    tx.s = getBufferFromHex(rv.s)

    const signedChainId = calculateChainIdFromV(tx.v)
    if (signedChainId !== networkId) {
      console.error(
        'Invalid networkId signature returned. Expected: ' +
        networkId +
        ', Got: ' +
        signedChainId,
        'InvalidNetworkId'
      )
    }

    const signedTransactionObject = getSignTransactionObject(tx)
    return signedTransactionObject
  }

  callMethod = async (contractAddress, contractAbi, methodName, ...params) => {
    let functionParams = []
    if (['undefined', 'object'].indexOf(typeof params[params.length - 1]) >= 0) {
      console.log('no param')
    } else {
      params.forEach((item) => {
        if (['undefined', 'object'].indexOf(typeof item)) {
          functionParams.push(item)
        }
      })
    }
    const web3 = this.getWeb3()
    const targetContract = new web3.eth.Contract(contractAbi, contractAddress)
    const rv = await targetContract.methods[methodName](...functionParams).call()
    return rv
  }

  getUtxoDetails = async (txHash) => {
    const details = await axios.get(`${ledgerApiUrl}/transactions/${txHash}/hex`)
    console.log(details)
    return details.data[0].hex
  }

  createNewBtcPaymentTransaction = async (inputs, to, amount, fee, changeIndex) => {
    const btcLedger = await this.getBtcLedger()
    const changeAddressPath = `${baseBtcPath}/0'/1/${changeIndex}`

    let associatedKeysets = []
    let finalInputs = []
    let inputValueTotal = 0
    for (let i = 0; i < inputs.length; i++) {
      const utxo = inputs[i]
      const utxoDetails = await this.getUtxoDetails(utxo.txHash)

      const txObj = btcLedger.splitTransaction(utxoDetails, true)
      const input = [txObj, utxo.outputIndex]
      finalInputs.push(input)
      associatedKeysets.push(utxo.keyPath)
      inputValueTotal += utxo.value
    }
    let outputs = []
    let amountBuffer = Buffer.alloc(8, 0)
    amountBuffer.writeUIntLE(amount, 0, 8)
    const txOutput = {
      amount: amountBuffer,
      script: address.toOutputScript(to, networks.testnet)
    }
    outputs.push(txOutput)
    const change = inputValueTotal - amount - fee // 138 bytes for 1 input, 64 bytes per additional input

    let changeBuffer = Buffer.alloc(8, 0)
    changeBuffer.writeUIntLE(change, 0, 8)
    const changeAddress = (await btcLedger.getWalletPublicKey(changeAddressPath, false, true)).bitcoinAddress
    const changeOutput = {
      amount: changeBuffer,
      script: address.toOutputScript(changeAddress, networks.testnet)
    }
    outputs.push(changeOutput)

    const outputScriptHex = btcLedger.serializeTransactionOutputs({ outputs: outputs }).toString('hex')
    const signedTxRaw = await btcLedger.createPaymentTransactionNew(
      finalInputs,
      associatedKeysets,
      changeAddressPath,
      outputScriptHex,
      undefined,
      undefined,
      true
    )

    return signedTxRaw
  }

  broadcastBtcRawTx = async (txRaw) => {
    const rv = await axios.post(
      `${ledgerApiUrl}/transactions/send`,
      { tx: txRaw })
    return rv.data.result
  }

  getUtxosFromTxs = (txs, address) => {
    let utxos = []
    let spent = {}
    txs.forEach(tx => {
      tx.inputs.forEach(input => {
        if (input.address === address) {
          if (!spent[input.output_hash]) {
            spent[input.output_hash] = {}
          }
          spent[input.output_hash][input.output_index] = true
        }
      })
    })
    txs.forEach(tx => {
      tx.outputs.forEach(output => {
        if (output.address === address) {
          if (!spent[tx.hash]) {
            spent[tx.hash] = {}
          }
          if (!spent[tx.hash][output.output_index]) {
            utxos.push({
              txHash: tx.hash,
              outputIndex: output.output_index,
              value: output.value
            })
          }
        }
      })
    })

    return utxos
  }

  syncBtcAccountInfo = async (accountIndex) => {
    const btcLedger = await this.getBtcLedger()
    let i = 0
    let totalBalance = 0
    let addresses = []
    let gap = 0
    let utxos = []
    let changeIndex = 0
    let addressIndex = 0
    while (gap < 5) {
      let address
      const externalAddressPath = `${baseBtcPath}/${accountIndex}'/0/${i}`
      const external = await btcLedger.getWalletPublicKey(externalAddressPath, false, true)
      const externalAddress = external.bitcoinAddress

      const externalAddressData = (await axios.get(`${ledgerApiUrl}/addresses/${externalAddress}/transactions?noToken=true&truncated=true`)).data
      if (externalAddressData.txs.length === 0) {
        gap += 1
      } else {
        addressIndex = i
        gap = 0
        utxos = this.getUtxosFromTxs(externalAddressData.txs, externalAddress)
        if (utxos.length !== 0) {
          let value = utxos.reduce((accu, utxo) => {
            return accu + utxo.value
          }, 0)
          totalBalance += value
          address = {
            path: externalAddressPath,
            publicKeyInfo: external,
            utxos: utxos
          }
          addresses.push(address)
        }
      }
      // check change address
      const internalAddressPath = `${baseBtcPath}/${accountIndex}'/1/${i}`
      const internal = await btcLedger.getWalletPublicKey(internalAddressPath, false, true)
      const internalAddress = internal.bitcoinAddress
      const internalAddressData = (await axios.get(`${ledgerApiUrl}/addresses/${internalAddress}/transactions?noToken=true&truncated=true`)).data
      if (internalAddressData.txs.length !== 0) {
        changeIndex = i
        gap = 0
        utxos = this.getUtxosFromTxs(internalAddressData.txs, internalAddress)
        if (utxos.length !== 0) {
          let value = utxos.reduce((accu, utxo) => {
            return accu + utxo.value
          }, 0)
          totalBalance += value
          address = {
            path: internalAddressPath,
            publicKeyInfo: internal,
            utxos: utxos
          }
          addresses.push(address)
        }
      }

      i += 1
    }
    let accountData = {
      balance: { bitcoin: new BN(totalBalance) },
      nextAddressIndex: addressIndex + 1,
      nextChangeIndex: changeIndex + 1,
      addresses,
      lastBlockHeight: await this.getLastBlockHeight(),
      lastUpdate: moment().unix()
    }
    return accountData
  }

  getLastBlockHeight = async () => {
    const rv = (await axios.get(blockcypherBaseUrl)).data
    return rv.height
  }
}

export default LedgerNanoS

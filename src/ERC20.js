import Web3 from 'web3'
import BN from 'bn.js'
import ERC20_ABI from './contracts/ERC20.js'
import { getCrypto } from './tokens'

const infuraApi = `https://${process.env.REACT_APP_NETWORK_NAME}.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`

async function getBalance (address, cryptoType) {
  let web3 = new Web3(new Web3.providers.HttpProvider(infuraApi))
  const targetContract = new web3.eth.Contract(ERC20_ABI, getCrypto(cryptoType).address)
  return targetContract.methods.balanceOf(address).call()
}

async function getTransferTxObj (from, to, transferAmount, cryptoType) {
  let web3 = new Web3(new Web3.providers.HttpProvider(infuraApi))
  let contractAddr = getCrypto(cryptoType).address
  const targetContract = new web3.eth.Contract(ERC20_ABI, contractAddr)
  let data = targetContract.methods.transfer(to, transferAmount).encodeABI()

  return {
    from: from,
    to: contractAddr,
    data: data
  }
}

async function getGasPriceGivenBalance (address, gas) {
  let web3 = new Web3(new Web3.providers.HttpProvider(infuraApi))
  let balance = new BN(await web3.eth.getBalance(address))
  return balance.div(new BN(gas)).toString()
}

export default { getBalance, getTransferTxObj, getGasPriceGivenBalance }

import update from 'immutability-helper'

const initialState = {
  walletSelection: null,
  cryptoSelection: null,
  transferForm: {
    transferAmount: '',
    password: '',
    destination: '',
    sender: ''
  }
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SELECT_CRYPTO':
      return {
        ...state,
        cryptoSelection: state.cryptoSelection === action.payload ? null : action.payload
      }
    case 'SELECT_WALLET':
      return {
        ...state,
        walletSelection: state.walletSelection === action.payload ? null : action.payload,
        cryptoSelection: null
      }
    case 'UPDATE_TRANSFER_FORM':
      return {
        ...state,
        transferForm: action.payload
      }
    case 'GENERATE_SECURITY_ANSWER':
      return update(state, { transferForm: { password: { $set: action.payload } } })
    case 'GET_TRANSFER_FULFILLED':
      return {
        ...state,
        transfer: action.payload
      }
    case 'VERIFY_PASSWORD_FULFILLED':
    // store decrypted wallet in transfer.wallet
      return update(state, { transfer: { wallet: { $set: action.payload } } })
    case 'CLEAR_DECRYPTED_WALLET':
      return update(state, { transfer: { wallet: { $set: null } } })
    default: // need this for default case
      return state
  }
}

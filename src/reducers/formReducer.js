/*
 *  Handle UI and form states
 */

import update from 'immutability-helper'

const initialState = {
  walletSelection: null,
  cryptoSelection: null,
  transferForm: {
    transferAmount: '',
    transferCurrencyAmount: '',
    password: '',
    destination: '',
    sender: '',
    message: '',
    formError: {
      sender: null,
      destination: null,
      transferAmount: null,
      password: null,
      message: null
    }
  }
}

export default function (state = initialState, action) {
  switch (action.type) {
    case 'SELECT_CRYPTO':
      return {
        ...state,
        cryptoSelection: state.cryptoSelection === action.payload ? null : action.payload,
        transferForm: initialState.transferForm
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
    case 'BACK_TO_HOME':
      return initialState
    default: // need this for default case
      return state
  }
}

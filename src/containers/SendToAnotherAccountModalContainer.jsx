import React, { Component } from 'react'
import { connect } from 'react-redux'

import { createLoadingSelector, createErrorSelector } from '../selectors'
import SendToAnotherAccountModal from '../components/SendToAnotherAccountModal'
import utils from '../utils'
import { decryptCloudWalletAccount } from '../actions/accountActions.js'
import { clearError } from '../actions/userActions'
import { verifyAccount, checkWalletConnection } from '../actions/walletActions'

class SendToAnotherAccountModalContainer extends Component {
  handleConfirm = password => {
    const { cloudWalletAccounts, accountSelection, checkWalletConnection } = this.props
    const cloudWalletAccount = cloudWalletAccounts.find(
      _account => _account.cryptoType === accountSelection.cryptoType
    )
    this.props.checkWalletConnection(cloudWalletAccount, { password: password })
  }

  render () {
    const {
      transferForm,
      handleClose,
      open,
      accountSelection,
      txFee,
      cryptoPrice,
      currency,
      decryptCloudWalletAccount,
      actionsPending,
      error,
      clearError
    } = this.props
    const toCurrencyAmount = cryptoAmount =>
      utils.toCurrencyAmount(cryptoAmount, cryptoPrice[transferForm.cryptoType], currency)

    return (
      <SendToAnotherAccountModal
        open={open}
        handleClose={handleClose}
        transferForm={transferForm}
        accountSelection={accountSelection}
        txFee={txFee}
        currencyAmount={{
          transferAmount: transferForm && toCurrencyAmount(transferForm.transferAmount),
          txFee: txFee && toCurrencyAmount(txFee.costInStandardUnit)
        }}
        decryptCloudWalletAccount={decryptCloudWalletAccount}
        actionsPending={actionsPending}
        error={error}
        clearError={clearError}
        handleConfirm={this.handleConfirm}
      />
    )
  }
}

const decryptCloudWalletAccountSelector = createLoadingSelector(['DECRYPT_CLOUD_WALLET_ACCOUNT'])
const errorSelector = createErrorSelector(['DECRYPT_CLOUD_WALLET_ACCOUNT'])
const mapDispatchToProps = dispatch => {
  return {
    decryptCloudWalletAccount: (accountData, password) =>
      dispatch(decryptCloudWalletAccount(accountData, password)),
    clearError: () => dispatch(clearError()),
    verifyAccount: (accountData, options) => dispatch(verifyAccount(accountData, options)),
    checkWalletConnection: (accountData, options) =>
      dispatch(checkWalletConnection(accountData, options))
  }
}

const mapStateToProps = state => {
  return {
    transferForm: state.formReducer.transferForm,
    accountSelection: state.accountReducer.cryptoAccounts.find(_account =>
      utils.accountsEqual(_account, state.formReducer.transferForm.accountId)
    ),
    txFee: state.transferReducer.txFee,
    cryptoPrice: state.cryptoPriceReducer.cryptoPrice,
    currency: state.cryptoPriceReducer.currency,
    actionsPending: {
      decryptCloudWalletAccount: decryptCloudWalletAccountSelector(state)
    },
    error: errorSelector(state),
    cloudWalletAccounts: state.accountReducer.cryptoAccounts.filter(
      account => account.walletType === 'drive'
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SendToAnotherAccountModalContainer)

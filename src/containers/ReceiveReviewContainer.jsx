import React, { Component } from 'react'
import { connect } from 'react-redux'
import ReceiveReview from '../components/ReceiveReviewComponent'
import { acceptTransfer, getTxCost } from '../actions/transferActions'
import { createLoadingSelector, createErrorSelector } from '../selectors'
import { goToStep } from '../actions/navigationActions'
import { getUtxoForEscrowWallet } from '../actions/walletActions'
import moment from 'moment'

class ReceiveReviewContainer extends Component {
  componentDidMount () {
    const { transfer, getUtxoForEscrowWallet } = this.props
    if (transfer.cryptoType === 'bitcoin') {
      getUtxoForEscrowWallet()
    } else {
      this.props.getTxCost({ cryptoType: transfer.cryptoType, transferAmount: transfer.transferAmount })
    }
  }

  componentDidUpdate (prevProps) {
    const { transfer, escrowWallet, txCost, actionsPending, error } = this.props
    const prevActionsPending = prevProps.actionsPending
    if (!txCost &&
      !actionsPending.getTxCost &&
      (prevActionsPending.getUtxoForEscrowWallet && !actionsPending.getUtxoForEscrowWallet) &&
      transfer.cryptoType === 'bitcoin' &&
      !error) {
      this.props.getTxCost({ cryptoType: transfer.cryptoType, transferAmount: transfer.transferAmount, escrowWallet: escrowWallet })
    }
  }

  render () {
    const { wallet, lastUsedWallet, transfer, walletSelection } = this.props
    const { cryptoType, sendTimestamp } = transfer

    // if set to not used or no used address, use connected wallet
    let destinationAddress = (lastUsedWallet.notUsed || !lastUsedWallet[walletSelection].crypto[cryptoType])
      ? wallet.crypto[cryptoType][0].address
      : lastUsedWallet[walletSelection].crypto[cryptoType].address
    let sentOn = moment.unix(sendTimestamp).format('MMM Do YYYY, HH:mm:ss')
    return (
      <ReceiveReview
        destinationAddress={destinationAddress}
        {...this.props}
        sentOn={sentOn}
      />
    )
  }
}

const acceptTransferSelector = createLoadingSelector(['ACCEPT_TRANSFER', 'ACCEPT_TRANSFER_TRANSACTION_HASH_RETRIEVED'])
const getTxCostSelector = createLoadingSelector(['GET_TX_COST'])
const getUtxoForEscrowWalletSelector = createLoadingSelector(['GET_UTXO_FOR_ESCROW_WALLET'])

const errorSelector = createErrorSelector(['ACCEPT_TRANSFER', 'ACCEPT_TRANSFER_TRANSACTION_HASH_RETRIEVED'])

const mapDispatchToProps = dispatch => {
  return {
    acceptTransfer: (txRequest) => dispatch(acceptTransfer(txRequest)),
    getTxCost: (txRequest) => dispatch(getTxCost(txRequest)),
    goToStep: (n) => dispatch(goToStep('receive', n)),
    getUtxoForEscrowWallet: () => dispatch(getUtxoForEscrowWallet())
  }
}

const mapStateToProps = state => {
  return {
    transfer: state.transferReducer.transfer,
    escrowWallet: state.walletReducer.escrowWallet,
    lastUsedWallet: state.walletReducer.lastUsedWallet,
    walletSelection: state.formReducer.walletSelection,
    wallet: state.walletReducer.wallet[state.formReducer.walletSelection],
    txCost: state.transferReducer.txCost,
    actionsPending: {
      acceptTransfer: acceptTransferSelector(state),
      getTxCost: getTxCostSelector(state),
      getUtxoForEscrowWallet: getUtxoForEscrowWalletSelector(state)
    },
    error: errorSelector(state)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReceiveReviewContainer)

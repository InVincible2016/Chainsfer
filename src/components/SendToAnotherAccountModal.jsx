import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles'

import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import CloseIcon from '@material-ui/icons/Close'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import LinearProgress from '@material-ui/core/LinearProgress'
import TextField from '@material-ui/core/TextField'
import IconButton from '@material-ui/core/IconButton'
import TransferForm from '../containers/FormContainer'
import { getCryptoSymbol, getTxFeesCryptoType } from '../tokens'

class SendToAnotherAccountModal extends Component {
  state = {
    step: 0,
    password: ''
  }

  handlePasswordChange = value => {
    const { error, clearError } = this.props
    if (error) {
      clearError()
    }
    this.setState({ password: value })
  }

  renderReview = () => {
    const {
      transferForm,
      accountSelection,
      txFee,
      currencyAmount,
      error,
      classes,
      actionsPending,
      handleConfirm
    } = this.props
    const { formError, transferAmount } = transferForm
    const { cryptoType } = accountSelection
    const { password } = this.state
    return (
      <Grid container direction='column'>
        <Grid item>
          <Grid container direction='column' spacing={2}>
            <Grid item>
              <Typography variant='h3'>Review and Confirm</Typography>
            </Grid>
            <Grid item>
              <Grid container direction='row' align='center'>
                <Grid item xs={6}>
                  <Grid container direction='column' alignItems='flex-start'>
                    <Typography variant='caption'>From</Typography>
                    <Typography variant='body2' id='senderName'>
                      Chainsfr Wallet
                    </Typography>
                  </Grid>
                </Grid>
                <Grid item xs={6}>
                  <Grid container direction='column' alignItems='flex-start'>
                    <Typography variant='caption'>To</Typography>
                    <Typography variant='body2' id='receiverName'>
                      Ethereum
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Grid container direction='column' alignItems='flex-start'>
                <Grid item>
                  <Typography variant='caption'>Amount</Typography>
                </Grid>
                <Grid item>
                  <Grid container direction='row' alignItems='center'>
                    <Typography variant='body2'>
                      {transferAmount} {getCryptoSymbol(cryptoType)}
                    </Typography>
                    <Typography style={{ marginLeft: '10px' }} variant='caption'>
                      ( ≈ {currencyAmount.transferAmount} )
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Grid container direction='column' alignItems='flex-start'>
                <Grid item>
                  <Typography variant='caption'>Transaction Fee</Typography>
                </Grid>
                <Grid item>
                  <Grid container direction='row' alignItems='center'>
                    <Typography variant='body2'>
                      {txFee.costInStandardUnit} {getCryptoSymbol(getTxFeesCryptoType(cryptoType))}
                    </Typography>
                    <Typography style={{ marginLeft: '10px' }} variant='caption'>
                      ( ≈ {currencyAmount.txFee} )
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Divider />
            </Grid>
            <Grid item>
              <Typography variant='body2' align='left'>
                Unlock your Chainsfr Wallet to transfer
              </Typography>
            </Grid>
            <Grid item>
              <TextField
                fullWidth
                autoFocus
                id='password'
                label='Chainsfr Wallet Password'
                margin='normal'
                variant='outlined'
                error={!!error}
                helperText={error ? 'Incorrect password' : ''}
                onChange={event => {
                  this.handlePasswordChange(event.target.value)
                }}
                value={password}
                onKeyPress={ev => {
                  if (ev.key === 'Enter') {
                    handleConfirm(password)
                  }
                }}
              />
            </Grid>
            {actionsPending.verifyEscrowAccountPassword && (
              <Grid item>
                <Grid
                  container
                  direction='column'
                  className={classes.linearProgressContainer}
                  spacing={2}
                >
                  <Grid item>
                    <Typography variant='body2'>Checking password...</Typography>
                  </Grid>
                  <Grid item>
                    <LinearProgress className={classes.linearProgress} />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    )
  }

  renderDialogContent = () => {
    const { step } = this.state
    let content
    switch (step) {
      case 0:
        content = <TransferForm form='direct_transfer' />
        break
      case 1:
        content = this.renderReview()
        break
      case 2:
        content = this.renderReceipt()
        break
      default:
        content = null
    }
    return <div>{content}</div>
  }

  renderDialogActions = () => {
    const { classes, handleClose, handleConfirm } = this.props
    const { step, password } = this.state
    let buttons
    switch (step) {
      case 0:
        buttons = (
          <>
            <Button
              onClick={() => {
                handleClose()
              }}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={() => {
                this.setState({ step: 1 })
              }}
            >
              Continue
            </Button>
          </>
        )
        break
      case 1:
        buttons = (
          <>
            <Button
              onClick={() => {
                this.setState({ step: 0 })
              }}
            >
              Back to Previous
            </Button>
            <Button
              variant='contained'
              color='primary'
              onClick={() => {
                handleConfirm(password)
              }}
            >
              Confirm and Transfer
            </Button>
          </>
        )
        break
      case 2:
      default:
        buttons = (
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              handleClose()
            }}
          >
            Close
          </Button>
        )
        break
    }
    return <DialogActions className={classes.dialogAction}>{buttons}</DialogActions>
  }

  renderDialogTitle = () => {
    const { step } = this.state
    switch (step) {
      case 0:
        return <Typography variant='h2'>Transfer to Another Account</Typography>
      case 1:
        return <Typography variant='h2'>Review and Confirm</Typography>
    }
  }

  render() {
    const { open, handleClose, classes } = this.props
    return (
      <Dialog
        open={open}
        onClose={() => {
          handleClose()
        }}
        scroll='body'
      >
        <DialogTitle disableTypography className={classes.dialogTitle}>
          {this.renderDialogTitle()}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          {this.renderDialogContent()}
        </DialogContent>
        {this.renderDialogActions()}
      </Dialog>
    )
  }
}

const styles = theme => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500]
  },
  dialogTitle: {
    padding: '60px 60px 30px 60px'
  },
  dialogContent: {
    padding: '0px 60px 0px 60px',
    height: '450px',
    width: '480px'
  },
  dialogAction: {
    padding: '40px 60px 40px 60px'
  },
  linearProgressContainer: {
    backgroundColor: 'rgba(66,133,244,0.05)',
    borderRadius: '4px',
    padding: '10px 20px 10px 20px',
    marginTop: '30px'
  }
})

export default withStyles(styles)(SendToAnotherAccountModal)

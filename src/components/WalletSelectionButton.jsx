import React, { Component } from 'react'

import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Card from '@material-ui/core/Card'
import { spacing } from '../styles/base'

class WalletSelectionButton extends Component {
  render () {
    const { classes, wallet, selected, handleClick } = this.props
    let cardStyle = classes.walletCard
    if (selected) cardStyle = classes.walletCardSelected
    if (wallet.disabled) cardStyle = classes.walletCardDisabled
    return (
      <Card
        className={cardStyle}
        onClick={() => {
          if (!wallet.disabled) handleClick(wallet.walletType)
        }}
      >
        <img className={classes.walletLogo} src={wallet.logo} alt='wallet-logo' />
        <Typography variant='body1' align='center'>
          {wallet.title}
        </Typography>
        {wallet.disabled && <Typography variant='caption'>{wallet.disabledReason}</Typography>}
      </Card>
    )
  }
}
const styles = theme => ({
  walletLogo: {
    width: '64px',
    height: '64px',
    alignSelf: 'center',
    marginBottom: spacing.base
  },
  walletCard: {
    paddingTop: '32px',
    paddingBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #fff'
  },
  walletCardSelected: {
    paddingTop: '32px',
    paddingBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #4285F4',
    borderRadius: '8px',
    backgroundColor: 'rgba(66,133,244,0.1)',
    transition: 'all .3s ease'
  },
  walletCardDisabled: {
    paddingTop: '32px',
    paddingBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid #D2D2D2',
    borderRadius: '8px',
    backgroundColor: '#F8F8F8',
    transition: 'all .3s ease'
  }
})
export default withStyles(styles)(WalletSelectionButton)

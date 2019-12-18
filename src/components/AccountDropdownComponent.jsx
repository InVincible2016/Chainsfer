// @flow
import React, { Component } from 'react'
import Grid from '@material-ui/core/Grid'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import Box from '@material-ui/core/Box'
import LinearProgress from '@material-ui/core/LinearProgress'
import { withStyles } from '@material-ui/core/styles'
import Select from '@material-ui/core/Select'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import OutlinedInput from '@material-ui/core/OutlinedInput'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import Skeleton from '@material-ui/lab/Skeleton'
import { accountStatus } from '../types/account.flow'
import { getCryptoSymbol, getCryptoLogo } from '../tokens.js'
import type { AccountData } from '../types/account.flow'

// Material Icons
import AddIcon from '@material-ui/icons/AddRounded'

type Props = {
  classes: Object,
  account: ?AccountData,
  cryptoAccounts: Array<Object>,
  pending: boolean,
  error: Object,
  onChange: Function,
  addAccount: Function,
  toCurrencyAmount: Function,
  inputLabel: string
}

type State = {
  inputLabelWidth: number
}

class AccountDropdownComponent extends Component<Props, State> {
  inputLabelRef: any

  constructor(props) {
    super(props)
    this.state = {
      inputLabelWidth: 0
    }
    this.inputLabelRef = React.createRef()
  }
  componentDidMount() {
    this.setState({ inputLabelWidth: this.inputLabelRef.current.offsetWidth })
  }

  renderAccountItem = item => {
    const { toCurrencyAmount } = this.props

    if (item.skeletonOnly) {
      return (
        <React.Fragment>
          <Box pr={1} mb={1}>
            <Skeleton variant='circle' width={40} height={40} />
          </Box>
          <Skeleton height={6} />
          <Skeleton height={6} width='80%' />
        </React.Fragment>
      )
    }

    return (
      <Box display='flex' justifyContent='space-between' flexGrow={1}>
        <Box display='flex' flexDirection='row'>
          <Box mr={1} display='inline'>
            {/* crypto icon */}
            <Avatar src={getCryptoLogo(item.cryptoType)}></Avatar>
          </Box>
          <Box>
            {/* name and address */}
            <Typography variant='body2'>{item.displayName}</Typography>
            <Typography variant='caption'>{item.address}</Typography>
          </Box>
        </Box>
        {/* balance */}
        <Box display='flex' flexDirection='column' alignItems='flex-end'>
          {item.status === accountStatus.syncing ? (
            <Skeleton style={{ margin: '0px', width: '100%', minWidth: '100px' }} />
          ) : (
            <Typography variant='body2'>
              {item.balanceInStandardUnit} {getCryptoSymbol(item.cryptoType)}
            </Typography>
          )}
          <Typography variant='caption'>
            {toCurrencyAmount(item.balanceInStandardUnit, item.cryptoType)}
          </Typography>
        </Box>
      </Box>
    )
  }

  render() {
    const { account, cryptoAccounts, onChange, addAccount, pending, error, inputLabel } = this.props
    let skeletonCryptoAccounts = []
    if (pending) {
      skeletonCryptoAccounts = [
        { skeletonOnly: true },
        { skeletonOnly: true },
        { skeletonOnly: true }
      ]
    }

    return (
      <Grid container direction='column'>
        <FormControl variant='outlined' margin='normal'>
          <InputLabel ref={this.inputLabelRef} htmlFor='destination-helper'>
            {inputLabel}
          </InputLabel>
          <Select
            renderValue={value => {
              return (
                <Box display='flex' flexDirection='row'>
                  <Box mr={1} display='inline'>
                    {/* crypto icon */}
                    <Avatar src={getCryptoLogo(value.cryptoType)}></Avatar>
                  </Box>
                  <Box>
                    {/* name and address */}
                    <Typography variant='body2'>{value.displayName}</Typography>
                    <Typography variant='caption'>{value.address}</Typography>
                  </Box>
                </Box>
              )
            }}
            value={account || ''}
            onChange={onChange}
            input={<OutlinedInput labelWidth={this.state.inputLabelWidth} name='Select Account' />}
            error={!!error}
            id='accountSelection'
          >
            {skeletonCryptoAccounts.map((accountData, index) => {
              return (
                <MenuItem key={index} value={accountData}>
                  {this.renderAccountItem(accountData)}
                </MenuItem>
              )
            })}
            {cryptoAccounts.map((accountData, index) => {
              return (
                <MenuItem key={index} value={accountData}>
                  {this.renderAccountItem(accountData)}
                </MenuItem>
              )
            })}
            {cryptoAccounts.length !== 0 && <Divider />}
            <MenuItem value='addCryptoAccount'>
              <Button onClick={() => addAccount()} color='primary' fullWidth>
                <AddIcon fontSize='small' />
                Add Account
              </Button>
            </MenuItem>
          </Select>
        </FormControl>
        {account && account.status === accountStatus.syncing && (
          <Box
            style={{
              marginTop: '10px',
              padding: '20px',
              backgroundColor: 'rgba(57, 51, 134, 0.05)',
              borderRadius: '4px'
            }}
          >
            <Typography variant='body2' style={{ marginBottom: '10px' }}>
              Checking your account
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </Grid>
    )
  }
}

const styles = theme => ({})

export default withStyles(styles)(AccountDropdownComponent)

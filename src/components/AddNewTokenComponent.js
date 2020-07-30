import React, { Component, useState, useEffect } from 'react'
import { withStyles, makeStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Box from '@material-ui/core/Box'
import Drawer from '@material-ui/core/Drawer'

import FormControl from '@material-ui/core/FormControl'
import Fuse from 'fuse.js'
import { getCryptoSymbol, getCryptoTitle } from '../tokens.js'
import { getWalletTitle, getWalletLogo } from '../wallet'
import Input from '@material-ui/core/Input'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import OutlinedInput from '@material-ui/core/OutlinedInput'
import Select from '@material-ui/core/Select'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'

const useStyle = makeStyles(theme => ({
  drawerPapper: {
    maxWidth: '480px',
    width: '100%'
  },
  title: {
    padding: '30px 20px'
  }
}))

const TokenSearchComponent = props => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState([])
  const { ethContracts } = props

  const fuse = new Fuse(ethContracts, {
    shouldSort: true,
    threshold: 0.45,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [{ name: 'name', weight: 0.5 }, { name: 'symbol', weight: 0.5 }]
  })

  function onQueryChange (e) {
    setSearchQuery(e.target.value)
    const result = fuse.search(e.target.value)
    console.log('result', result)
  }

  return (
    <Box padding='10px' display='flex' flexDirection='column'>
      <FormControl variant='outlined'>
        <TextField value={searchQuery} placeholder='Search token' onChange={onQueryChange} />
      </FormControl>
      <Typography vairiant='h4'>Search results</Typography>
    </Box>
  )
}

const AddTokenDrawer = props => {
  const [selectedWallet, setSelectedWallet] = useState('')
  const { ethContracts } = props

  const classes = useStyle()
  const { wallets, onClose } = props

  function renderWalletItem (item: string) {
    item = JSON.parse(item)
    return (
      <Box>
        <Box display='flex' flexDirection='row' alignItems='center'>
          <Box mr={1} display='inline'>
            {/* wallet icon */}
            <Avatar style={{ borderRadius: '2px' }} src={getWalletLogo(item.walletType)} />
          </Box>
          <Box>
            {/* name and wallet title*/}
            <Typography variant='body2'>{item.name}</Typography>
            <Typography variant='caption'>
              {getWalletTitle(item.walletType)}, {getCryptoTitle(item.platformType)}
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Drawer anchor='right' open onClose={onClose} classes={{ paper: classes.drawerPapper }}>
      <Box display='relative' padding='30px 20px'>
        <Typography variant='h3'>Add Tokens</Typography>
      </Box>
      <Box display='flex' flexDirection='column' padding='20px 30px'>
        <FormControl variant='outlined'>
          <InputLabel>Add to Account</InputLabel>
          <Select
            labelId='walletSelect'
            renderValue={renderWalletItem}
            value={selectedWallet}
            onChange={e => {
              setSelectedWallet(e.target.value)
            }}
            input={<OutlinedInput labelWidth={90} name='Add to Account' />}
            id='walletSelect'
          >
            {wallets.map((wallet, index) => (
              <MenuItem key={index} value={JSON.stringify(wallet)}>
                {renderWalletItem(JSON.stringify(wallet))}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TokenSearchComponent ethContracts={ethContracts} />
      </Box>
    </Drawer>
  )
}

export default AddTokenDrawer

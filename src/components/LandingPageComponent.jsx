import React, { Component } from 'react'

import { withStyles, makeStyles, useTheme } from '@material-ui/core/styles'
import { Link } from 'react-router-dom'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import Box from '@material-ui/core/Box'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import CircularProgress from '@material-ui/core/CircularProgress'
import InfiniteScroll from 'react-infinite-scroller'
import moment from 'moment'
import { getCryptoSymbol } from '../tokens'
import path from '../Paths.js'
import Divider from '@material-ui/core/Divider'
import MuiLink from '@material-ui/core/Link'
import url from '../url'
import UserAvatar from './MicroComponents/UserAvatar'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import EmptyStateImage from '../images/empty_state_01.png'

const toUserReadableState = {
  SENDER: {
    /* sending */
    SEND_PENDING: {
      label: 'Sending',
      labelStyle: 'recentTransferItemTransferStatusPending',
      action: 'TRACK_TX'
    },
    SEND_FAILURE: {
      label: 'Send Failed',
      labelStyle: 'recentTransferItemTransferStatusError',
      action: 'TRACK_TX'
    },

    /* receiving */
    SEND_CONFIRMED_RECEIVE_NOT_INITIATED: {
      label: 'Pending',
      labelStyle: 'recentTransferItemTransferStatusPending',
      action: 'CANCEL'
    },
    SEND_CONFIRMED_RECEIVE_PENDING: {
      label: 'Accepting',
      labelStyle: 'recentTransferItemTransferStatusPending'
    },
    SEND_CONFIRMED_RECEIVE_FAILURE: {
      label: 'Pending',
      labelStyle: 'recentTransferItemTransferStatusPending',
      action: 'CANCEL'
    },
    SEND_CONFIRMED_RECEIVE_CONFIRMED: {
      label: 'Completed',
      labelStyle: 'recentTransferItemTransferStatusTextBased'
    },

    /* receiving during expiration */
    SEND_CONFIRMED_EXPIRED_RECEIVE_NOT_INITIATED: {
      label: 'Expired',
      labelStyle: 'recentTransferItemTransferStatusError',
      action: 'CANCEL'
    },
    SEND_CONFIRMED_EXPIRED_RECEIVE_PENDING: {
      // receiver is accepting the transfer,
      // ignore expiration status to prevent sender from
      // cancelling the transfer
      label: 'Accepting',
      labelStyle: 'recentTransferItemTransferStatusPending'
    },
    SEND_CONFIRMED_EXPIRED_RECEIVE_FAILURE: {
      // receive failure just after expiration
      // receiver cannot accept the transfer anymore due to
      // expiration, mark it as "Expired"
      label: 'Expired',
      labelStyle: 'recentTransferItemTransferStatusError',
      action: 'CANCEL'
    },
    SEND_CONFIRMED_EXPIRED_RECEIVE_CONFIRMED: {
      label: 'Completed',
      labelStyle: 'recentTransferItemTransferStatusTextBased'
    },

    /* cancellation */
    SEND_CONFIRMED_CANCEL_PENDING: {
      label: 'Cancelling',
      labelStyle: 'recentTransferItemTransferStatusPending',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_CANCEL_FAILURE: {
      label: 'Cancel Failed',
      labelStyle: 'recentTransferItemTransferStatusError',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_CANCEL_CONFIRMED: {
      label: 'Cancelled',
      labelStyle: 'recentTransferItemTransferStatusTextBased'
    },

    /* cancellation after expiration */
    SEND_CONFIRMED_EXPIRED_CANCEL_PENDING: {
      label: 'Reclaiming',
      labelStyle: 'recentTransferItemTransferStatusPending',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_EXPIRED_CANCEL_FAILURE: {
      label: 'Reclaim Failed',
      labelStyle: 'recentTransferItemTransferStatusError',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_EXPIRED_CANCEL_CONFIRMED: {
      label: 'Reclaimed',
      labelStyle: 'recentTransferItemTransferStatusTextBased'
    }
  },
  RECEIVER: {
    /* receiving */
    SEND_CONFIRMED_RECEIVE_PENDING: {
      label: 'Receiving',
      labelStyle: 'recentTransferItemTransferStatusPending',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_RECEIVE_FAILURE: {
      label: 'Receive Failed',
      labelStyle: 'recentTransferItemTransferStatusError',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_RECEIVE_CONFIRMED: {
      label: 'Completed',
      labelStyle: 'recentTransferItemTransferStatusTextBased'
    },

    /* receiving during expiration */
    SEND_CONFIRMED_EXPIRED_RECEIVE_PENDING: {
      label: 'Receiving',
      labelStyle: 'recentTransferItemTransferStatusPending',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_EXPIRED_RECEIVE_FAILURE: {
      label: 'Receive Failed',
      labelStyle: 'recentTransferItemTransferStatusError',
      action: 'TRACK_TX'
    },
    SEND_CONFIRMED_EXPIRED_RECEIVE_CONFIRMED: {
      label: 'Completed',
      labelStyle: 'recentTransferItemTransferStatusTextBased'
    }
  },
  DIRECT_TRANSFER: {
    SEND_PENDING: 'Sending',
    SEND_FAILURE: 'Send Failed',
    SEND_CONFIRMED: 'Completed'
  }
}

const baseRecentTransferItemTransferStatus = {
  borderRadius: '100px',
  color: 'white',
  padding: '5px',
  width: '86px',
  height: '14px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'stretch'
}

const useStyles = makeStyles({
  expansionPanelRoot: {
    boxShadow: 'none',
    marginTop: '0px',
    paddingTop: 5,
    paddingBottom: 5
  },
  expansionPanelExpanded: {
    marginTop: 'auto'
  },
  txHistoryTitleContainer: {
    margin: '10px 0px 10px 0px',
    width: '100%',
    padding: '0px 60px 0px 24px'
  },
  recentTransferItemTransferStatusPending: {
    ...baseRecentTransferItemTransferStatus,
    backgroundColor: '#F49B20'
  },
  recentTransferItemTransferStatusTextBased: {
    ...baseRecentTransferItemTransferStatus,
    backgroundColor: '#43B384'
  },
  recentTransferItemTransferStatusError: {
    ...baseRecentTransferItemTransferStatus,
    backgroundColor: '#A8A8A8'
  },
  recentTransferItemTransferMessage: {
    maxWidth: '300px',
    // prevent overflow for long messages
    wordWrap: 'break-word',
    // additional margin to make message boundary clearer
    marginBottom: '20px'
  },
  recentTransferItemTransferId: {
    color: '#777777',
    fontSize: '12px'
  },
  recentTransferItemCancelBtn: {
    padding: '0px',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '10px'
  },
  trasnferDirection: {
    borderRadius: '100px',
    color: '#777777',
    height: '14px',
    padding: '5px 10px 5px 10px',
    backgroundColor: '#E9E9E9'
  },
  coloredBackgrond: {
    backgroundColor: '#FAFBFE'
  },
  container: {
    paddingTop: 40,
    paddingBottom: 30
  }
})

export function UserRecentTransactions (props) {
  const classes = useStyles()
  const { actionsPending, transferHistory, loadMoreTransferHistory } = props
  const theme = useTheme()
  const wide = useMediaQuery(theme.breakpoints.up('sm'))

  function renderRecentTransferItem (transfer, i) {
    if (transfer.error) {
      return (
        <ExpansionPanel
          key={i + 1}
          className={i % 2 === 0 ? undefined : classes.coloredBackgrond}
          classes={{
            root: classes.expansionPanelRoot,
            expanded: classes.expansionPanelExpanded,
            content: classes.expansionPanelSummaryContent
          }}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Grid container direction='row' alignItems='center' justify='center'>
              <Typography>{transfer.error}</Typography>
            </Grid>
          </ExpansionPanelSummary>
        </ExpansionPanel>
      )
    }
    let secondaryDesc = null

    // show timestamp of the first action by either sender or receiver
    if (transfer.transferType === 'SENDER') {
      secondaryDesc = 'on ' + moment.unix(transfer.sendTimestamp).format('MMM Do YYYY, HH:mm')
    } else if (transfer.transferType === 'RECEIVER') {
      secondaryDesc = 'on ' + moment.unix(transfer.receiveTimestamp).format('MMM Do YYYY, HH:mm')
    }

    const txHash = transfer.cancelTxHash ? transfer.cancelTxHash : transfer.sendTxHash
    return (
      <ExpansionPanel
        key={i + 1}
        className={i % 2 === 0 ? undefined : classes.coloredBackgrond}
        classes={{
          root: classes.expansionPanelRoot,
          expanded: classes.expansionPanelExpanded
        }}
      >
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Grid container direction='row' alignItems='center'>
            <Grid xs={7} md={7} item>
              <Grid container alignItems='center' spacing={1}>
                <Grid item xs={12} md={2}>
                  <Box>
                    <Typography
                      variant='button'
                      align='center'
                      className={classes.trasnferDirection}
                    >
                      {transfer.transferType === 'SENDER' ? 'To' : 'From'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md>
                  <Box display='flex' flexDirection='row' alignItems='center'>
                    {transfer.transferType === 'SENDER' ? (
                      <>
                        <UserAvatar
                          name={transfer.receiverName}
                          src={transfer.receiverAvatar}
                          style={{ width: 32 }}
                        />
                        <Box ml={1}>
                          <Typography variant='body2'>{transfer.receiverName}</Typography>
                          <Typography variant='caption'>{secondaryDesc}</Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        <UserAvatar
                          name={transfer.senderName}
                          src={transfer.senderAvatar}
                          style={{ width: 32 }}
                        />
                        <Box ml={1}>
                          <Typography variant='body2'>{transfer.senderName}</Typography>
                          <Typography variant='caption'>{secondaryDesc}</Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid xs={5} md={4} item>
              <Grid
                container
                direction='row'
                justify='space-between'
                alignItems='center'
                spacing={1}
              >
                <Grid item xs={12} sm='auto'>
                  <Box display='flex' justifyContent='flex-end'>
                    <Box
                      className={
                        classes[
                          toUserReadableState[transfer.transferType][transfer.state].labelStyle
                        ]
                      }
                    >
                      <Typography variant='button' align='center'>
                        {toUserReadableState[transfer.transferType][transfer.state].label}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm='auto'>
                  <Box
                    display='flex'
                    flexDirection='column'
                    alignItems='flex-end'
                    justifyContent='flex-end'
                  >
                    <Typography variant='body2'>
                      {transfer.transferType === 'SENDER' ? '-' : '+'}
                      {transfer.transferAmount} {getCryptoSymbol(transfer.cryptoType)}
                    </Typography>
                    <Typography align='right' variant='caption'>
                      {transfer.transferType === 'SENDER' ? '-' : '+'}
                      {transfer.transferCurrencyAmount}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Grid container direction='column' justify='center' alignItems='flex-start'>
            <Grid item>
              <Typography variant='caption'>
                Transfer ID:{' '}
                {transfer.transferType === 'SENDER' ? transfer.transferId : transfer.receivingId}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant='caption'>
                {transfer.transferType === 'SENDER'
                  ? `To: ${transfer.destination}`
                  : `From: ${transfer.sender}`}
              </Typography>
            </Grid>
            {transfer.password && (
              <Grid item>
                <Typography variant='caption'>Security Answer: {transfer.password}</Typography>
              </Grid>
            )}
            {transfer.sendMessage && (
              <Grid item>
                <Typography variant='caption' className={classes.recentTransferItemTransferMessage}>
                  Message: {transfer.sendMessage}
                </Typography>
              </Grid>
            )}
            {transfer.cancelMessage && (
              <Grid item>
                <Typography variant='caption' className={classes.recentTransferItemTransferMessage}>
                  Cancellation Reason: {transfer.cancelMessage}
                </Typography>
              </Grid>
            )}
            {toUserReadableState[transfer.transferType][transfer.state].action === 'TRACK_TX' && (
              <Grid item>
                <Typography variant='caption'>
                  You can track the Transaction
                  <MuiLink
                    target='_blank'
                    rel='noopener'
                    href={url.getExplorerTx(transfer.cryptoType, txHash)}
                  >
                    {' here'}
                  </MuiLink>
                </Typography>
              </Grid>
            )}
            {toUserReadableState[transfer.transferType][transfer.state].action === 'CANCEL' && (
              <Grid item>
                <Button
                  color='primary'
                  component={Link}
                  target='_blank'
                  rel='noopener'
                  to={`cancel?id=${transfer.transferId}`}
                  className={classes.recentTransferItemCancelBtn}
                >
                  Cancel Transfer
                </Button>
              </Grid>
            )}
            {/* always show receipt */}
            <Grid item>
              <Button
                color='primary'
                component={Link}
                target='_blank'
                rel='noopener'
                to={`${path.receipt}?${
                  transfer.transferId ? 'transferId' : 'receivingId'
                }=${transfer.transferId || transfer.receivingId}`}
                className={classes.recentTransferItemCancelBtn}
              >
                View Receipt
              </Button>
            </Grid>
          </Grid>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }

  return (
    <Container className={classes.container}>
      <Grid container direction='column' justify='center' alignItems='stretch'>
        <Grid item>
          <Grid container direction='row'>
            <Grid item>
              <Typography variant='h2' data-test-id='rt_title'>
                Recent Transactions
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid style={{ minHeight: '300px', maxHeight: '500px', overflow: 'auto' }}>
          <InfiniteScroll
            loader={
              actionsPending.getTransferHistory && (
                <Grid container direction='row' justify='center' key={0} alignItems='center'>
                  <CircularProgress color='primary' style={{ marginTop: '30px' }} />
                </Grid>
              )
            }
            threshold={300}
            pageStart={0}
            loadMore={() => {
              if (!actionsPending.getTransferHistory) {
                loadMoreTransferHistory(transferHistory.history.length)
              }
            }}
            useWindow={false}
            hasMore={transferHistory.hasMore}
            initialLoad={false}
          >
            <Grid item className={classes.txHistoryTitleContainer}>
              <Grid container direction='row' alignItems='center'>
                <Grid item xs={6} md={7}>
                  <Typography variant='h6'>Transaction</Typography>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Box
                    display='flex'
                    flexDirection='row'
                    alignItems='center'
                    justifyContent={wide ? 'space-between' : 'flex-end'}
                  >
                    {wide ? (
                      <>
                        <Typography variant='h6'>Status</Typography>
                        <Typography variant='h6'>Amount</Typography>
                      </>
                    ) : (
                      <Typography variant='h6'>Status/Amount</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Divider />
            {!actionsPending.getTransferHistory && transferHistory.history.length === 0 && (
              <Box display='flex' flexDirection='column' alignItems='center' mt={6} mb={6}>
                <Box mb={2}>
                  <img src={EmptyStateImage} alt='Empty State' data-test-id='empty_img' />
                </Box>
                <Typography variant='subtitle2' color='textSecondary'>
                  It seems you don't have any transactions yet
                </Typography>
              </Box>
            )}
            {transferHistory.history.map((transfer, i) => renderRecentTransferItem(transfer, i))}
          </InfiniteScroll>
        </Grid>
      </Grid>
    </Container>
  )
}

class LandingPageComponent extends Component {
  renderUpperSection = props => {
    const { classes, push } = this.props
    return (
      <Box
        className={classes.coloredBackgrond}
        alignItems='center'
        justifyContent='center'
        display='flex'
      >
        <Container className={classes.container}>
          <Grid container direction='row-reverse'>
            <Grid item md={6} xs={12}>
              <Box display='flex' justifyContent='center' height='225px' width='100%'>
                <iframe
                  width='100%'
                  maxWidth='400px'
                  src='https://www.youtube.com/embed/TeHbsQ0-wmM'
                  frameborder='0'
                  allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'
                  title='landingFrame'
                  allowFullScreen
                  data-test-id='video_embed'
                />
              </Box>
            </Grid>
            <Grid item md={6} xs={12} className={classes.upperBigGridItem}>
              <Box
                display='flex'
                alignItems='flex-start'
                flexDirection='column'
                height='100%'
                justifyContent='center'
              >
                <Typography variant='h2' data-test-id='emt_title'>
                  Email Transfer
                </Typography>
                <Typography className={classes.descText} data-test-id='emt_subtitle'>
                  Description goes here...
                </Typography>
                <Box display='flex' alignItems='center' mt={1} width='100%'>
                  <Grid container>
                    <Grid item className={classes.uppperSmallGridItem}>
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={() => push(path.transfer)}
                        data-test-id='emt_btn'
                      >
                        Start Email Transfer
                      </Button>
                    </Grid>
                    <Grid item className={classes.uppperSmallGridItem}>
                      <Button
                        className={classes.lightbtn}
                        color='primary'
                        onClick={() => push(path.accounts)}
                        data-test-id='cya_btn'
                      >
                        Connect Your Accounts
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    )
  }

  render () {
    const { actionsPending, transferHistory, loadMoreTransferHistory } = this.props
    return (
      <Box display='flex' flexDirection='column'>
        {this.renderUpperSection()}
        <UserRecentTransactions
          actionsPending={actionsPending}
          transferHistory={transferHistory}
          loadMoreTransferHistory={loadMoreTransferHistory}
        />
      </Box>
    )
  }
}

const styles = theme => ({
  coloredBackgrond: {
    backgroundColor: '#FAFBFE'
  },
  upperBigGridItem: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: '30px'
    }
  },
  uppperSmallGridItem: {
    marginTop: '20px',
    marginRight: '40px'
  },
  lightbtn: {
    backgroundColor: 'rgba(57, 51, 134, 0.05)'
  },
  container: {
    paddingTop: 40,
    paddingBottom: 30,
    [theme.breakpoints.up('sm')]: {
      paddingLeft: '30px',
      paddingRight: '30px'
    }
  },
  descText: {
    lineHeight: '20px',
    fontSize: 14,
    fontWeight: '600',
    color: '#777777'
  }
})

export default withStyles(styles)(LandingPageComponent)

import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import AccountCircle from '@material-ui/icons/AccountCircle'
import Button from '@material-ui/core/Button'
import { Link } from 'react-router-dom'
import path from '../Paths.js'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import IconButton from '@material-ui/core/IconButton'
import Grid from '@material-ui/core/Grid'
import Avatar from '@material-ui/core/Avatar'
import { uiColors } from '../styles/color'
import ChainsfrLogoWhite from '../images/chainsfr_logo_white.svg'

class NavBarComponent extends Component {
  state = {
    anchorEl: null
  }

  handleToggle = event => {
    this.setState({ anchorEl: event.currentTarget })
  }

  handleClose = action => event => {
    if (action === 'logout') {
      this.props.onLogout()
    }

    this.setState({ anchorEl: null })
  }

  render () {
    const { classes, backToHome, profile } = this.props
    const { anchorEl } = this.state

    return (
      <AppBar position='static' color='primary'>
        <Toolbar>
          <Grid
            container
            direction='row'
            justify='space-between'
            alignItems='center'
          >
            <Grid item>
              <Button
                classes={{ root: classes.homeButton }}
                component={Link}
                to={path.home}
                onClick={() => {
                  backToHome()
                }}
                id='back'
              >
                <img className={classes.chainsfrLogo} src={ChainsfrLogoWhite} alt='Chainsfr Logo' />
              </Button>
            </Grid>
            {profile.isAuthenticated && (
              <Grid item>
                <IconButton
                  buttonRef={node => {
                    this.anchorEl = node
                  }}
                  aria-owns={anchorEl ? 'simple-menu' : undefined}
                  aria-haspopup='true'
                  onClick={this.handleToggle}
                  id='avatarBtn'
                >
                  {profile &&
                  profile.profileObj &&
                  profile.profileObj.imageUrl
                    ? <Avatar
                      alt=''
                      src={profile.profileObj.imageUrl}
                      className={classes.avatar}
                    />
                    : <AccountCircle className={classes.userIcon} id='accountCircle' />
                  }
                </IconButton>
                <Menu
                  id='simple-menu'
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={this.handleClose()}
                >
                  <MenuItem disabled > {profile.profileObj.email} </MenuItem>
                  <MenuItem onClick={this.handleClose('logout')} id='logout'>
                      Logout
                  </MenuItem>
                </Menu>
              </Grid>
            )}
          </Grid>
        </Toolbar>
      </AppBar>
    )
  }
}

const styles = theme => ({
  grow: {
    flexGrow: 1
  },
  appNameText: {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 600
  },
  homeButton: {
    '&:hover': {
      backgroundColor: 'transparent'
    }
  },
  userIcon: {
    color: '#ffffff'
  },
  avatar: {
    width: '32px',
    height: '32px',
    border: 'solid 1px',
    borderColor: uiColors.border
  },
  chainsfrLogo: {
    width: 120
  }
})

export default withStyles(styles)(NavBarComponent)

import React, { Component } from 'react'
import { connect } from 'react-redux'
import NavBarComponent from '../components/NavBarComponent'
import { onLogout, refreshAccessToken } from '../actions/userActions'
import { backToHome } from '../actions/navigationActions'
import path from '../Paths.js'
import moment from 'moment'
import { createLoadingSelector } from '../selectors'

class NavBarContainer extends Component {
  backToHome=() => {
    const { location, backToHome } = this.props
    if (location.pathname === path.transfer) {
      backToHome()
    }
  }

  checkLoginStatus = () => {
    const { profile, refreshAccessToken } = this.props
    if (profile.isAuthenticated) {
      // check access token status
      const { tokenObj } = profile
      // refresh if access token expires in 10 mins
      if (tokenObj.expires_at / 1000 <= moment().unix() + 600) {
        refreshAccessToken()
      }
    }
  }

  componentDidMount () {
    this.checkLoginStatus()
    setInterval(
      () => {
        this.checkLoginStatus()
      },
      1000 * 60 * 30
    )
  }

  render () {
    let { onLogout, profile, actionsPending } = this.props
    return (
      <NavBarComponent
        onLogout={onLogout}
        profile={profile}
        backToHome={this.backToHome}
        disabled={actionsPending.createCloudWallet}
      />)
  }
}
const createCloudWalletSelector = createLoadingSelector(['CREATE_CLOUD_WALLET'])

const mapDispatchToProps = dispatch => {
  return {
    onLogout: () => dispatch(onLogout()),
    backToHome: () => dispatch(backToHome()),
    refreshAccessToken: () => dispatch(refreshAccessToken())
  }
}

const mapStateToProps = state => {
  return {
    profile: state.userReducer.profile,
    actionsPending: {
      createCloudWallet: createCloudWalletSelector(state)
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NavBarContainer)

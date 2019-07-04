import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import { connectedRouterRedirect } from 'redux-auth-wrapper/history4/redirect'
import locationHelperBuilder from 'redux-auth-wrapper/history4/locationHelper'
import LoginContainer from './containers/LoginContainer'
import TransferContainer from './containers/TransferContainer'
import ReceiveContainer from './containers/ReceiveContainer'
import CancelContainer from './containers/CancelContainer'
import WalletContainer from './containers/WalletContainer'
import Footer from './static/Footer'
import NaviBar from './containers/NavBarContainer'
import paths from './Paths'
import { ThemeProvider } from '@material-ui/styles'
import { store, history } from './configureStore'
import LandingPage from './containers/LandingPageContainer'
import { SnackbarProvider } from 'notistack'
import NotifierComponent from './components/NotifierComponent'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import BrowserNotSupportedComponent from './components/BrowserNotSupportedComponent'
import FAQContainer from './containers/FAQContainer'
import { detect } from 'detect-browser'
import { theme } from './styles/theme'

const browser = detect()

const userIsAuthenticated = connectedRouterRedirect({
  // The url to redirect user to if they fail
  redirectPath: '/login',
  // If selector is true, wrapper will not redirect
  // For example let's check that state contains user data
  authenticatedSelector: state => state.userReducer.profile.isAuthenticated,
  // A nice display name for this check
  wrapperDisplayName: 'UserIsAuthenticated'
})

const locationHelper = locationHelperBuilder({})

const userIsNotAuthenticated = connectedRouterRedirect({
  // This sends the user either to the query param route if we have one, or to the landing page if none is specified and the user is already logged in
  redirectPath: (state, ownProps) => locationHelper.getRedirectQueryParam(ownProps) || '/',
  // This prevents us from adding the query parameter when we send the user away from the login page
  allowRedirectBack: false,
  // If selector is true, wrapper will not redirect
  // So if there is no user data, then we show the page
  authenticatedSelector: state => !state.userReducer.profile.isAuthenticated,
  // A nice display name for this check
  wrapperDisplayName: 'UserIsNotAuthenticated'
})

const defaultLayoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  flexDirection: 'column'
}

const loginLayoutStyle = {
  minHeight: '100vh',
  flexDirection: 'column',
  display: 'flex'
}

const componentStyle = {
  minHeight: '100vh',
  flexDirection: 'column'
}

function browserSupported () {
  if (browser && browser.name === 'chrome') {
    let v = browser.version.split('.')[0]
    if (parseInt(v) >= 73) {
      return true
    }
  }
  return false
}

const DefaultLayout = ({ component: Component, ...rest }) => {
  return (
    <Route {...rest} render={matchProps => (
      <div style={defaultLayoutStyle}>
        <NaviBar {...matchProps} />
        <div style={componentStyle}>
          {browserSupported()
            ? <Component {...matchProps} />
            : <BrowserNotSupportedComponent />
          }
        </div>
        <NotifierComponent />
        <FAQContainer />
        <Footer />
      </div>
    )} />
  )
}

const LoginLayout = ({ component: Component, ...rest }) => {
  return (
    <Route {...rest} render={matchProps => (
      <div style={loginLayoutStyle}>
        {browserSupported()
          ? <Component {...matchProps} />
          : <BrowserNotSupportedComponent />
        }
        <NotifierComponent />
      </div>
    )} />
  )
}

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      auth: false
    }
    console.info(`Build ${process.env.REACT_APP_VERSION}-${process.env.REACT_APP_ENV}`)
  }

  render () {
    return (
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <SnackbarProvider action={[
            <IconButton
              key='close'
              aria-label='Close'
              color='inherit'
            >
              <CloseIcon />
            </IconButton>
          ]}>
            <ConnectedRouter history={history}>
              <Switch>
                <LoginLayout path={paths.login} component={userIsNotAuthenticated(LoginContainer)} />
                <DefaultLayout exact path={paths.home} component={userIsAuthenticated(LandingPage)} />
                <DefaultLayout exact path={paths.wallet} component={userIsAuthenticated(WalletContainer)} />
                <DefaultLayout path={`${paths.transfer}`} component={userIsAuthenticated(TransferContainer)} />
                <DefaultLayout path={`${paths.receive}`} component={ReceiveContainer} />
                <DefaultLayout path={`${paths.cancel}`} component={userIsAuthenticated(CancelContainer)} />
              </Switch>
            </ConnectedRouter>
          </SnackbarProvider>
        </Provider>
      </ThemeProvider>
    )
  }
}

export default App

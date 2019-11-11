import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import userReducer from './reducers/userReducer.js'
import accountReducer from './reducers/accountReducer.js'
import transferReducer from './reducers/transferReducer.js'
import formReducer from './reducers/formReducer.js'
import walletReducer from './reducers/walletReducer.js'
import navigationReducer from './reducers/navigationReducer.js'
import loadingReducer from './reducers/loadingReducer.js'
import errorReducer from './reducers/errorReducer.js'
import notificationReducer from './reducers/notificationReducer.js'
import cryptoPriceReducer from './reducers/cryptoPriceReducer.js'

export default history =>
  combineReducers({
    router: connectRouter(history),
    userReducer,
    accountReducer,
    transferReducer,
    formReducer,
    walletReducer,
    navigationReducer,
    loadingReducer,
    errorReducer,
    notificationReducer,
    cryptoPriceReducer
  })

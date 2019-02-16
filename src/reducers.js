import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import userReducer from './reducers/userReducer.js'
import transferReducer from './reducers/transferReducer.js'
import formReducer from './reducers/formReducer.js'
import walletReducer from './reducers/walletReducer.js'
import loadingReducer from './reducers/loadingReducer.js'
import errorReducer from './reducers/errorReducer.js'

export default (history) => combineReducers({
  router: connectRouter(history),
  userReducer,
  transferReducer,
  formReducer,
  walletReducer,
  loadingReducer,
  errorReducer
})

import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import promiseMiddleware from 'redux-promise-middleware'
import errorMiddleware from './errorMiddleware'
import logger from 'redux-logger'
import { persistStore, persistReducer, createTransform } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import reducers from './reducers'
import { routerMiddleware } from 'connected-react-router'
import { createBrowserHistory } from 'history'
import { trackerMiddleware } from './trackerMiddleware'
import { BN } from 'ethereumjs-util'

const history = createBrowserHistory()

function configureStore (reducers) {
  const middlewares = [
    routerMiddleware(history),
    trackerMiddleware,
    errorMiddleware,
    promiseMiddleware(),
    thunk
  ]

  if (process.env.NODE_ENV === `development`) {
    middlewares.push(logger)
  }

  const enhancer = compose(applyMiddleware(...middlewares))

  return createStore(reducers, enhancer)
}

const serializeTransform = createTransform(
  // transform state on its way to being serialized and persisted.
  (inboundState, key) => {
    let _transactions = []
    for (let tx of inboundState.transactions) {
      const { txReceipt } = tx
      _transactions.push({
        ...tx,
        txReceipt: txReceipt
          ? {
              ...txReceipt,
              blockNumber: txReceipt.blockNumber.toString(),
              cumulativeGasUse: txReceipt.cumulativeGasUsed.toString(),
              transactionIndex: txReceipt.transactionIndex.toString()
            }
          : undefined
      })
    }
    let serializeState = {
      transactions: _transactions
    }
    return serializeState
  },
  // transform state being rehydrated
  (outboundState, key) => {
    let _transactions = []
    for (let tx of outboundState.transactions) {
      const { txReceipt } = tx
      _transactions.push({
        ...tx,
        txReceipt: txReceipt
          ? {
              ...txReceipt,
              blockNumber: new BN(txReceipt.blockNumber),
              cumulativeGasUse: new BN(txReceipt.cumulativeGasUsed),
              transactionIndex: new BN(txReceipt.transactionIndex)
            }
          : undefined
      })
    }
    let serializeState = {
      transactions: _transactions
    }
    return serializeState
  },
  // define which reducers this transform gets called for.
  { whitelist: ['txControllerReducer'] }
)

const persistConfig = {
  key: 'root',
  storage,
  stateReconciler: autoMergeLevel2,
  transforms: [serializeTransform],
  whitelist: ['userReducer', 'txControllerReducer']
}

const persistedReducer = persistReducer(persistConfig, reducers(history))

var store = configureStore(persistedReducer)
var persistor = persistStore(store)

export { store, persistor, history }

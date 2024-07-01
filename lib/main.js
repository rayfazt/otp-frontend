// import necessary React/Redux libraries
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import { Provider } from 'react-redux'
import { render } from 'react-dom'
import createLogger from 'redux-logger'
import React from 'react'
import thunk from 'redux-thunk'
// import OTP-RR components
import { connectRouter, routerMiddleware } from 'connected-react-router'
import { createHashHistory } from 'history'

import '../index.css'

import Webapp from './app'

import {
  createCallTakerReducer,
  createOtpReducer,
  createUserReducer
} from './index'

import(CSS)

// eslint-disable-next-line no-undef
const otpConfig = require(YAML_CONFIG)

const history = createHashHistory()

const middleware = [thunk, routerMiddleware(history)]

if (process.env.NODE_ENV === 'development') {
  middleware.push(createLogger())
}

// set up the redux store
const store = createStore(
  combineReducers({
    callTaker: createCallTakerReducer(otpConfig),
    otp: createOtpReducer(otpConfig),
    router: connectRouter(history),
    user: createUserReducer(otpConfig)
  }),
  compose(applyMiddleware(...middleware))
)

// render the app
render(
  <Provider store={store}>
    <Webapp />
  </Provider>,
  document.getElementById('main')
)

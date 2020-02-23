import { put, takeEvery, all, call, fork, select } from 'redux-saga/effects'

import * as serverActions from '../actions/server';
import { types } from "../actions/types";

// Buy Business
function* buyBussiness(action) {
  yield put({ type: types.WS_MESSAGE, payload: serverActions.buyBusiness(action.payload) });
}

function* buyBusinessSaga() {
  yield takeEvery(types.BUY_BUSINESS, buyBussiness);
}

function* expandBusiness(action) {
  yield put({ type: types.WS_MESSAGE, payload: serverActions.expandBusiness(action.payload)})
}

// Expand Business
function* expandBusinessSaga() {
  yield takeEvery(types.EXPAND_BUSINESS, expandBusiness)
}

// Manage Order
function* manageOrder(action) {
  yield put({ type: types.WS_MESSAGE, payload: serverActions.manageOrder(action.payload) });
  const businesses = yield select((state) => state.game.businesses);
  const keys = Object.keys(businesses);
  const length = keys.length
  for (let index = 0; index < length; index++) {
    const business = businesses[keys[index]];
    if (business.manager === true && !business.processingOrder) {
      yield put({ type: types.MANAGE_ORDER, payload: keys[index] })
    }
  }

}

function* manageOrderSaga() {
  yield takeEvery(types.MANAGE_ORDER_FINISH, manageOrder);
}

export const getIsProcessing = (businessKey) => (state) => state.game.businesses[businessKey].processingOrder;

export const getBusinessTimer = (businessKey) => (state) => state.game.businesses[businessKey].timer;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function manageOrderDelay(businessKey) {
  return function* () {
    let isProcessing = yield select(getIsProcessing(businessKey));

    while (isProcessing) {
      yield put({ type: types.MANAGE_ORDER_TICK, payload: businessKey });
      isProcessing = yield select(getIsProcessing(businessKey));
      yield call(delay, 100);
    }

    yield put({ type: types.MANAGE_ORDER_FINISH, payload: businessKey });

  }
}

function* manageOrderTimer() {
  yield takeEvery(types.MANAGE_ORDER, function* (action) {
    yield fork(manageOrderDelay(action.payload))
  })

}

export default function* rootSaga() {
  yield all([
    buyBusinessSaga(),
    manageOrderTimer(),
    manageOrderSaga(),
    expandBusinessSaga()
  ])
}

// store.js
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./features/authSlice";
import dashboardReducer from "./features/dashboardSlice";
import productsReducer from "./features/productsSlice";
import usersReducer from "./features/usersSlice";
import queriesReducer from "./features/queriesSlice";
import ordersReducer from "./features/ordersSlice"; // ✅ Add this
import uiReducer from "./features/uiSlice";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  products: productsReducer,
  users: usersReducer,
  queries: queriesReducer,
  orders: ordersReducer, // ✅ Add this
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'products/uploadImages/pending',
          'products/uploadImages/fulfilled',
        ],
        ignoredPaths: ['products.editingProduct', 'products.addingProduct'],
      },
    }),
});

export const persistor = persistStore(store);

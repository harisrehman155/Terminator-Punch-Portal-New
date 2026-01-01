import { combineReducers } from "redux";
import AuthReducer from "./reducers/AuthReducer";
import HomeReducer from "./reducers/HomeReducer";
import { persistReducer, persistStore } from "redux-persist";
import storage from 'redux-persist/lib/storage'
import { configureStore } from "@reduxjs/toolkit";

const CombineReducer = combineReducers({
    auth: AuthReducer,
    home: HomeReducer
});


const persistedState = persistReducer({
    key: 'root-v3',
    storage
}, CombineReducer);


const Store = configureStore({
    reducer: persistedState,
    middleware: (getDefaultMiddleWare) =>
        getDefaultMiddleWare({
            serializableCheck: false,
            thunk: true
        })
});

const Persister = persistStore(Store);
export { Store, Persister };

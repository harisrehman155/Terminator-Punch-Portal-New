import { combineReducers } from "redux";
import AuthReducer from "./reducers/AuthReducer";
import HomeReducer from "./reducers/HomeReducer";
import AddressReducer from "./reducers/AddressReducer";
import CartReducer from "./reducers/CartReducer";
import WishlistReducer from "./reducers/WishlistReducer";
import RecentlyViewedReducer from "./reducers/RecentlyViewedReducer";
import OrderReducer from "./reducers/OrderReducer";
import ReviewReducer from "./reducers/ReviewReducer";
import otpReducer from "./reducers/otpReducer";
import EmailSubscriptionReducer from "./reducers/EmailSubscriptionReducer";
import PromoCodeReducer from "./reducers/PromoCodeReducer";
import PricingReducer from "./reducers/PricingReducer";
import { persistReducer, persistStore } from "redux-persist";
import storage from 'redux-persist/lib/storage'
import { configureStore } from "@reduxjs/toolkit";

const CombineReducer = combineReducers({
    auth: AuthReducer,
    home: HomeReducer,
    address: AddressReducer,
    cart: CartReducer,
    wishlist: WishlistReducer,
    recentlyViewed: RecentlyViewedReducer,
    order: OrderReducer,
    review: ReviewReducer,
    otp: otpReducer,
    emailSubscription: EmailSubscriptionReducer,
    promoCode: PromoCodeReducer,
    pricing: PricingReducer
});


const persistedState = persistReducer({
    key: 'root-v2',
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

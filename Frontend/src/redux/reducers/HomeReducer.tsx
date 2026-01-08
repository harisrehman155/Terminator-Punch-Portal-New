import { FETCH_LOOKUP_VALUES, CATEGORIES, FETCH_PRODUCTS, SET_PRODUCTS_LOADING, SET_PRODUCTS_ERROR, FETCH_TRENDING_PRODUCTS, FETCH_LATEST_PRODUCTS, FETCH_RECOMMENDED_PRODUCTS, FETCH_PRODUCT_DETAIL, SET_PRODUCT_DETAIL_LOADING, FETCH_USER_ORDERS, FETCH_USER_QUOTES, SET_DASHBOARD_LOADING, SET_DASHBOARD_ERROR } from "../ActionTypes";

// Custom action types for admin data
const FETCH_ADMIN_ORDERS = 'FETCH_ADMIN_ORDERS';
const FETCH_ADMIN_QUOTES = 'FETCH_ADMIN_QUOTES';

interface HomeState {
    lookupValues: any;
    categories: any[];
    products: any[];
    pagination: any;
    productsLoading: boolean;
    productsError: string | null;
    loading: boolean;
    error: string | null;
    trendingProducts: any[];
    latestProducts: any[];
    recommendedProducts: any[];
    productDetail: any;
    productDetailLoading: boolean;
    userOrders: any[];
    userQuotes: any[];
    adminOrders: any[];
    adminQuotes: any[];
    dashboardLoading: boolean;
    dashboardError: string | null;
}

const initialState: HomeState = {
    lookupValues: {},
    categories: [],
    products: [],
    pagination: null,
    productsLoading: false,
    productsError: null,
    loading: false,
    error: null,
    trendingProducts: [],
    latestProducts: [],
    recommendedProducts: [],
    productDetail: null,
    productDetailLoading: false,
    userOrders: [],
    userQuotes: [],
    adminOrders: [],
    adminQuotes: [],
    dashboardLoading: false,
    dashboardError: null
};

const HomeReducer = (state = initialState, action: any) => {
    switch (action.type) {
        case FETCH_LOOKUP_VALUES:
            return {
                ...state,
                lookupValues: action.payload,
                loading: false,
                error: null
            };
        case CATEGORIES:
            return {
                ...state,
                categories: action.payload,
                loading: false,
                error: null
            };
        case FETCH_PRODUCTS:
            return {
                ...state,
                products: action.payload.products,
                pagination: action.payload.pagination,
                productsError: null
            };
        case SET_PRODUCTS_LOADING:
            return {
                ...state,
                productsLoading: action.payload
            };
        case SET_PRODUCTS_ERROR:
            return {
                ...state,
                productsError: action.payload,
                productsLoading: false
            };
        case FETCH_TRENDING_PRODUCTS:
            return {
                ...state,
                trendingProducts: action.payload
            };
        case FETCH_LATEST_PRODUCTS:
            return {
                ...state,
                latestProducts: action.payload
            };
        case FETCH_RECOMMENDED_PRODUCTS:
            return {
                ...state,
                recommendedProducts: action.payload
            };
        case FETCH_PRODUCT_DETAIL:
            return {
                ...state,
                productDetail: action.payload
            };
        case SET_PRODUCT_DETAIL_LOADING:
            return {
                ...state,
                productDetailLoading: action.payload
            };
        case FETCH_USER_ORDERS:
            return {
                ...state,
                userOrders: action.payload,
                dashboardError: null
            };
        case FETCH_USER_QUOTES:
            return {
                ...state,
                userQuotes: action.payload,
                dashboardError: null
            };
        case SET_DASHBOARD_LOADING:
            return {
                ...state,
                dashboardLoading: action.payload
            };
        case SET_DASHBOARD_ERROR:
            return {
                ...state,
                dashboardError: action.payload,
                dashboardLoading: false
            };
        case FETCH_ADMIN_ORDERS:
            return {
                ...state,
                adminOrders: action.payload,
                dashboardError: null
            };
        case FETCH_ADMIN_QUOTES:
            return {
                ...state,
                adminQuotes: action.payload,
                dashboardError: null
            };
        default:
            return state;
    }
};

export default HomeReducer;
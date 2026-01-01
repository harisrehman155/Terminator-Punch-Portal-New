import { FETCH_LOOKUP_VALUES, CATEGORIES, FETCH_PRODUCTS, SET_PRODUCTS_LOADING, SET_PRODUCTS_ERROR, FETCH_TRENDING_PRODUCTS, FETCH_LATEST_PRODUCTS, FETCH_RECOMMENDED_PRODUCTS, FETCH_PRODUCT_DETAIL, SET_PRODUCT_DETAIL_LOADING } from "../ActionTypes";

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
    productDetailLoading: false
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
        default:
            return state;
    }
};

export default HomeReducer;
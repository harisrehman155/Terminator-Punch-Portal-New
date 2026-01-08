import { FETCH_LOOKUP_VALUES, CATEGORIES, FETCH_PRODUCTS, SET_PRODUCTS_LOADING, SET_PRODUCTS_ERROR, FETCH_TRENDING_PRODUCTS, FETCH_LATEST_PRODUCTS, FETCH_RECOMMENDED_PRODUCTS, FETCH_PRODUCT_DETAIL, SET_PRODUCT_DETAIL_LOADING } from "../ActionTypes";
import { categoryHeaderIds } from "../../utils/Constants";
import apiService, { HttpMethod } from "../../api/ApiService";

export const fetchLookupValues = () => {
    return async (dispatch) => {
        try {
            const headerIds = Object.values(categoryHeaderIds);
            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/public/lookups/values",
                data: {
                    header_ids: headerIds
                }
            });

            if (response.success) {
                dispatch({
                    type: FETCH_LOOKUP_VALUES,
                    payload: response.data
                });
                return { success: true, data: response.data };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching lookup values:', error);
            return { success: false, message: "Failed to fetch lookup values" };
        }
    };
};

export const fetchProducts = (filters = {}) => {
    return async (dispatch) => {
        try {
            dispatch({ type: SET_PRODUCTS_LOADING, payload: true });

            // Build query parameters from filters
            const queryParams = new URLSearchParams();

            if (filters.category && filters.category !== 'All') {
                queryParams.append('category', filters.category);
            }
            if (filters.color) {
                queryParams.append('color', filters.color);
            }
            if (filters.size) {
                queryParams.append('size', filters.size);
            }
            if (filters.stock && filters.stock.length > 0) {
                console.log('🔍 HomeAction - filters.stock received:', filters.stock);
                // Handle array of stock filters
                const stockArray = Array.isArray(filters.stock) ? filters.stock : [filters.stock];
                console.log('🔍 HomeAction - stockArray:', stockArray);
                // Map 'in' to 'In Stock' and 'out' to 'Out of Stock'
                const stockStatuses = stockArray.map(s => s === 'in' ? 'In Stock' : s === 'out' ? 'Out of Stock' : s);
                console.log('🔍 HomeAction - stockStatuses mapped:', stockStatuses);
                // Join multiple statuses with comma (backend will handle it)
                queryParams.append('stock_status', stockStatuses.join(','));
                console.log('🔍 HomeAction - Added to queryParams:', queryParams.toString());
            }
            if (filters.min_price) {
                queryParams.append('min_price', filters.min_price);
            }
            if (filters.max_price) {
                queryParams.append('max_price', filters.max_price);
            }
            if (filters.search) {
                queryParams.append('search', filters.search);
            }
            if (filters.sort) {
                queryParams.append('sort', filters.sort);
            }
            if (filters.page) {
                queryParams.append('page', filters.page);
            }
            if (filters.limit) {
                queryParams.append('limit', filters.limit);
            }

            const endpoint = `/public/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: endpoint
            });
            if (response.success) {
                dispatch({
                    type: FETCH_PRODUCTS,
                    payload: {
                        products: response.data,
                        pagination: response.pagination
                    }
                });
                return { success: true, data: response.data };
            } else {
                dispatch({ type: SET_PRODUCTS_ERROR, payload: response.message });
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            dispatch({ type: SET_PRODUCTS_ERROR, payload: "Failed to fetch products" });
            return { success: false, message: "Failed to fetch products" };
        } finally {
            dispatch({ type: SET_PRODUCTS_LOADING, payload: false });
        }
    };
};

export const fetchTrendingProducts = () => {
    return async (dispatch) => {
        try {
            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: "/public/products/trending?limit=4"
            });

            console.log('Trending products API response:', response);

            if (response.success) {
                // Handle different response formats
                const products = Array.isArray(response.data) 
                    ? response.data 
                    : (response.data?.products || response.data?.data || []);
                
                console.log('Trending products extracted:', products);
                
                dispatch({
                    type: FETCH_TRENDING_PRODUCTS,
                    payload: products
                });
                return { success: true, data: products };
            } else {
                console.error('Trending products API error:', response.message);
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching trending products:', error);
            return { success: false, message: "Failed to fetch trending products" };
        }
    };
};

export const fetchLatestProducts = () => {
    return async (dispatch) => {
        try {
            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: "/public/products/latest?limit=8"
            });

            if (response.success) {
                dispatch({
                    type: FETCH_LATEST_PRODUCTS,
                    payload: response.data
                });
                return { success: true, data: response.data };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching latest products:', error);
            return { success: false, message: "Failed to fetch latest products" };
        }
    };
};

export const fetchRecommendedProducts = (limit = 8) => {
    return async (dispatch) => {
        try {
            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: `/public/products/recommended?limit=${limit}`
            });

            if (response.success) {
                dispatch({
                    type: FETCH_RECOMMENDED_PRODUCTS,
                    payload: response.data
                });
                return { success: true, data: response.data };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching recommended products:', error);
            return { success: false, message: "Failed to fetch recommended products" };
        }
    };
};

export const fetchProductDetail = (productId) => {
    return async (dispatch) => {
        try {
            dispatch({ type: SET_PRODUCT_DETAIL_LOADING, payload: true });

            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: `/public/products/${productId}?t=${Date.now()}`
            });

            if (response.success) {
                dispatch({
                    type: FETCH_PRODUCT_DETAIL,
                    payload: response.data
                });
                return { success: true, data: response.data };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching product detail:', error);
            return { success: false, message: "Failed to fetch product detail" };
        } finally {
            dispatch({ type: SET_PRODUCT_DETAIL_LOADING, payload: false });
        }
    };
};

export const fetchCategories = (status = 'Active') => {
    return async (dispatch) => {
        try {
            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: `/public/categories?status=${status}`
            });

            if (response.success) {
                // Handle different response structures
                const categoriesData = response.data || response.categories || response;
                dispatch({
                    type: CATEGORIES,
                    payload: categoriesData
                });
                return { success: true, data: categoriesData };
            } else {
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, message: "Failed to fetch categories" };
        }
    };
};

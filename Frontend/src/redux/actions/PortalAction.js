import { FETCH_USER_ORDERS, FETCH_USER_QUOTES, SET_DASHBOARD_LOADING, SET_DASHBOARD_ERROR } from "../ActionTypes";
import apiService, { HttpMethod } from "../../api/ApiService";

/**
 * Fetch user's orders for dashboard
 */
export const fetchUserOrders = (filters = {}) => {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: true });

            const token = getState().auth.token;

            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: "/orders/my-orders",
                token: token
            });

            if (response.success) {
                dispatch({
                    type: FETCH_USER_ORDERS,
                    payload: response.data
                });
                return { success: true, data: response.data };
            } else {
                dispatch({ type: SET_DASHBOARD_ERROR, payload: response.message });
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching user orders:', error);
            const errorMessage = error.apiMessage || "Failed to fetch orders";
            dispatch({ type: SET_DASHBOARD_ERROR, payload: errorMessage });
            return { success: false, message: errorMessage };
        } finally {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
        }
    };
};

/**
 * Fetch user's quotes for dashboard
 */
export const fetchUserQuotes = (filters = {}) => {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: true });

            const token = getState().auth.token;

            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: "/quotes/my-quotes",
                token: token
            });

            if (response.success) {
                dispatch({
                    type: FETCH_USER_QUOTES,
                    payload: response.data
                });
                return { success: true, data: response.data };
            } else {
                dispatch({ type: SET_DASHBOARD_ERROR, payload: response.message });
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching user quotes:', error);
            const errorMessage = error.apiMessage || "Failed to fetch quotes";
            dispatch({ type: SET_DASHBOARD_ERROR, payload: errorMessage });
            return { success: false, message: errorMessage };
        } finally {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
        }
    };
};

/**
 * Fetch admin orders
 */
export const fetchAdminOrders = (filters = {}) => {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: true });

            const token = getState().auth.token;

            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: "/admin/orders",
                token: token
            });

            if (response.success) {
                dispatch({
                    type: 'FETCH_ADMIN_ORDERS',
                    payload: response.data.orders
                });
                return { success: true, data: response.data };
            } else {
                dispatch({ type: SET_DASHBOARD_ERROR, payload: response.message });
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching admin orders:', error);
            const errorMessage = error.apiMessage || "Failed to fetch admin orders";
            dispatch({ type: SET_DASHBOARD_ERROR, payload: errorMessage });
            return { success: false, message: errorMessage };
        } finally {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
        }
    };
};

/**
 * Fetch admin quotes
 */
export const fetchAdminQuotes = (filters = {}) => {
    return async (dispatch, getState) => {
        try {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: true });

            const token = getState().auth.token;

            const response = await apiService({
                method: HttpMethod.GET,
                endPoint: "/admin/quotes",
                token: token
            });

            if (response.success) {
                dispatch({
                    type: 'FETCH_ADMIN_QUOTES',
                    payload: response.data.quotes
                });
                return { success: true, data: response.data };
            } else {
                dispatch({ type: SET_DASHBOARD_ERROR, payload: response.message });
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Error fetching admin quotes:', error);
            const errorMessage = error.apiMessage || "Failed to fetch admin quotes";
            dispatch({ type: SET_DASHBOARD_ERROR, payload: errorMessage });
            return { success: false, message: errorMessage };
        } finally {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
        }
    };
};

/**
 * Fetch both orders and quotes for dashboard
 */
export const fetchDashboardData = () => {
    return async (dispatch) => {
        try {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: true });
            dispatch({ type: SET_DASHBOARD_ERROR, payload: null });

            // Fetch both orders and quotes in parallel
            const [ordersResult, quotesResult] = await Promise.all([
                dispatch(fetchUserOrders()),
                dispatch(fetchUserQuotes())
            ]);

            return {
                success: ordersResult.success && quotesResult.success,
                data: {
                    orders: ordersResult.data || [],
                    quotes: quotesResult.data || []
                }
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            const errorMessage = "Failed to load dashboard data";
            dispatch({ type: SET_DASHBOARD_ERROR, payload: errorMessage });
            return { success: false, message: errorMessage };
        } finally {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
        }
    };
};

/**
 * Fetch admin dashboard data
 */
export const fetchAdminDashboardData = () => {
    return async (dispatch) => {
        try {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: true });
            dispatch({ type: SET_DASHBOARD_ERROR, payload: null });

            // Fetch admin orders and quotes in parallel
            const [ordersResult, quotesResult] = await Promise.all([
                dispatch(fetchAdminOrders()),
                dispatch(fetchAdminQuotes())
            ]);

            return {
                success: ordersResult.success && quotesResult.success,
                data: {
                    orders: ordersResult.data?.orders || [],
                    quotes: quotesResult.data?.quotes || []
                }
            };
        } catch (error) {
            console.error('Error fetching admin dashboard data:', error);
            const errorMessage = "Failed to load admin dashboard data";
            dispatch({ type: SET_DASHBOARD_ERROR, payload: errorMessage });
            return { success: false, message: errorMessage };
        } finally {
            dispatch({ type: SET_DASHBOARD_LOADING, payload: false });
        }
    };
};

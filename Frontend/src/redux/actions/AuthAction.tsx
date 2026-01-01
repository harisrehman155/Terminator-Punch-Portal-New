import { LOGIN, LOGOUT, SET_AUTH_LOADING, SET_AUTH_ERROR, FORGOT_PASSWORD, RESET_PASSWORD } from "../ActionTypes";
import apiService, { HttpMethod } from "../../api/ApiService";
import { TOKEN_KEY, USER_KEY } from "../../utils/Constants";

export const login = (userData, token) => {
    return {
        type: LOGIN,
        payload: { userData, token }
    };
};

export const initializeAuth = () => {
    return (dispatch) => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const userString = localStorage.getItem(USER_KEY);

            if (token && userString) {
                const user = JSON.parse(userString);
                dispatch(login(user, token));
            }
        } catch (error) {
            console.error('Error initializing auth from localStorage:', error);
            // Clear corrupted data
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    };
};

export const logout = () => {
    return {
        type: LOGOUT
    };
};

export const setAuthLoading = (loading) => {
    return {
        type: SET_AUTH_LOADING,
        payload: loading
    };
};

export const setAuthError = (error) => {
    return {
        type: SET_AUTH_ERROR,
        payload: error
    };
};

export const verifyOTPAndLogin = (userData, token) => {
    return {
        type: LOGIN,
        payload: { userData, token }
    };
};

export const loginUser = (email, password) => {
    return async (dispatch) => {
        try {
            dispatch(setAuthLoading(true));
            dispatch(setAuthError(null));

            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/auth/login",
                data: { email, password }
            });

            console.log('API response:', response);

            if (response.status === 'success') {
                dispatch(login(response.data.user, response.data.token));
                return { success: true, data: response.data };
            } else {
                dispatch(setAuthError(response.message));
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);

            // Handle backend errors
            if (error.response && error.response.data) {
                const responseData = error.response.data;

                // Handle backend errors
                if (responseData.status === 'error') {
                    dispatch(setAuthError(responseData.message || "Login failed"));
                    return { success: false, message: responseData.message || "Login failed" };
                } else if (responseData.error) {
                    const backendError = responseData.error;
                    dispatch(setAuthError(backendError.message || "Login failed"));
                    return { success: false, message: backendError.message || "Login failed" };
                } else {
                    dispatch(setAuthError(responseData.message || "Login failed"));
                    return { success: false, message: responseData.message || "Login failed" };
                }
            } else {
                // Handle network or other errors
                const errorMessage = "Login failed. Please try again.";
                dispatch(setAuthError(errorMessage));
                return { success: false, message: errorMessage };
            }
        } finally {
            dispatch(setAuthLoading(false));
        }
    };
};

export const signupUser = (name, email, password, confirmPassword) => {
    return async (dispatch) => {
        try {
            dispatch(setAuthLoading(true));
            dispatch(setAuthError(null));

            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/auth/register",
                data: { name, email, password }
            });

            if (response.success) {
                return { success: true, data: response.data };
            } else {
                dispatch(setAuthError(response.message));
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Signup error:', error);

            // Handle backend errors
            if (error.response && error.response.data) {
                const responseData = error.response.data;

                // Check if it's a validation error with details
                if (responseData.error && responseData.error.code === 'VALIDATION_ERROR' && responseData.error.details) {
                    // Convert backend validation format to frontend format
                    const validationErrors = {};
                    responseData.error.details.forEach(detail => {
                        validationErrors[detail.path] = detail.message;
                    });

                    dispatch(setAuthError(responseData.error.message));
                    return {
                        success: false,
                        message: responseData.error.message,
                        errors: validationErrors
                    };
                } else {
                    // Handle other backend errors (including 409 conflict)
                    const errorMessage = responseData.message || "Signup failed";
                    dispatch(setAuthError(errorMessage));
                    return {
                        success: false,
                        message: errorMessage
                    };
                }
            } else {
                // Handle network or other errors
                const errorMessage = "Signup failed. Please try again.";
                dispatch(setAuthError(errorMessage));
                return { success: false, message: errorMessage };
            }
        } finally {
            dispatch(setAuthLoading(false));
        }
    };
};

export const logoutUser = () => {
    return async (dispatch) => {
        dispatch(logout());
    };
};

// Forgot password action
export const forgotPasswordUser = (email) => {
    return async (dispatch) => {
        try {
            dispatch(setAuthLoading(true));
            dispatch(setAuthError(null));

            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/auth/forgot-password",
                data: { email }
            });

            if (response.success) {
                return { success: true, message: response.message };
            } else {
                dispatch(setAuthError(response.message));
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Forgot password error:', error);

            if (error.response && error.response.data) {
                const responseData = error.response.data;
                dispatch(setAuthError(responseData.message || "Failed to send OTP"));
                return { success: false, message: responseData.message || "Failed to send OTP" };
            } else {
                const errorMessage = "Failed to send OTP. Please try again.";
                dispatch(setAuthError(errorMessage));
                return { success: false, message: errorMessage };
            }
        } finally {
            dispatch(setAuthLoading(false));
        }
    };
};

// Verify OTP action
export const verifyOtpUser = (email, otp) => {
    return async (dispatch) => {
        try {
            dispatch(setAuthLoading(true));
            dispatch(setAuthError(null));

            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/auth/verify-otp",
                data: { email, otp }
            });

            if (response.success) {
                return {
                    success: true,
                    data: { resetToken: response.data.resetToken },
                    message: response.message
                };
            } else {
                dispatch(setAuthError(response.message));
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Verify OTP error:', error);

            if (error.response && error.response.data) {
                const responseData = error.response.data;
                dispatch(setAuthError(responseData.message || "OTP verification failed"));
                return { success: false, message: responseData.message || "OTP verification failed" };
            } else {
                const errorMessage = "OTP verification failed. Please try again.";
                dispatch(setAuthError(errorMessage));
                return { success: false, message: errorMessage };
            }
        } finally {
            dispatch(setAuthLoading(false));
        }
    };
};

// Reset password action
export const resetPasswordUser = (resetToken, newPassword) => {
    return async (dispatch) => {
        try {
            dispatch(setAuthLoading(true));
            dispatch(setAuthError(null));

            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/auth/reset-password",
                data: { resetToken, newPassword }
            });

            if (response.success) {
                return { success: true, message: response.message };
            } else {
                dispatch(setAuthError(response.message));
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Reset password error:', error);

            if (error.response && error.response.data) {
                const responseData = error.response.data;
                dispatch(setAuthError(responseData.message || "Failed to reset password"));
                return { success: false, message: responseData.message || "Failed to reset password" };
            } else {
                const errorMessage = "Failed to reset password. Please try again.";
                dispatch(setAuthError(errorMessage));
                return { success: false, message: errorMessage };
            }
        } finally {
            dispatch(setAuthLoading(false));
        }
    };
};

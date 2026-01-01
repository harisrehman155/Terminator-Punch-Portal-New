import { LOGIN, LOGOUT, SET_AUTH_LOADING, SET_AUTH_ERROR, FORGOT_PASSWORD, RESET_PASSWORD } from "../ActionTypes";
import apiService, { HttpMethod } from "../../api/ApiService";

export const login = (userData, token) => {
    return {
        type: LOGIN,
        payload: { userData, token }
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
                endPoint: "/public/auth/login",
                data: { email, password }
            });
            
            console.log('🔍 AuthAction: Login API response:', response);
            console.log('🔍 AuthAction: Response needsVerification:', response.needsVerification);
            
            if (response.success) {
                // Check if user's email is verified
                if (!response.data.user.email_verified) {
                    // User exists but email not verified - redirect to OTP verification
                    return { 
                        success: false, 
                        needsVerification: true, 
                        email: response.data.user.email,
                        message: "Please verify your email to continue"
                    };
                }
                
                dispatch(login(response.data.user, response.data.token));
                return { success: true, data: response.data };
            } else {
                // Check if this is a needsVerification response (backend returns success: false with needsVerification: true)
                console.log('🔍 AuthAction: Checking needsVerification in else block:', response.needsVerification);
                if (response.needsVerification) {
                    console.log('🔍 AuthAction: Found needsVerification, redirecting to email verification');
                    return { 
                        success: false, 
                        needsVerification: true, 
                        email: response.email,
                        message: response.message || "Please verify your email to continue"
                    };
                }
                
                dispatch(setAuthError(response.message));
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle backend errors
            if (error.response && error.response.data) {
                const responseData = error.response.data;
                
                // Check if this is a needsVerification error
                if (responseData.needsVerification) {
                    console.log('🔍 Frontend: Detected needsVerification, redirecting to OTP page');
                    return { 
                        success: false, 
                        needsVerification: true, 
                        email: responseData.email,
                        message: responseData.message || "Please verify your email to continue"
                    };
                }
                
                // Handle other backend errors
                if (responseData.error) {
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
                endPoint: "/public/auth/signup",
                data: { name, email, password, confirmPassword }
            });
            
            if (response.success) {
                // Store user in Redux immediately after signup
                return { success: true, data: response.data, needsVerification: true };
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
            
            console.log('🔍 AuthAction: Sending forgot password request for:', email);
            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/public/auth/forgot-password",
                data: { email }
            });
            console.log('🔍 AuthAction: API response:', response);
            console.log('🔍 AuthAction: Response needsVerification:', response.needsVerification);
            
            if (response.success) {
                console.log('🔍 AuthAction: Success - returning success response');
                return { success: true, message: response.message };
            } else {
                console.log('🔍 AuthAction: API returned success: false -', response.message);
                dispatch(setAuthError(response.message));
                return { success: false, message: response.message };
            }
        } catch (error) {
            console.error('🔍 AuthAction: Forgot password error:', error);
            
            if (error.response && error.response.data) {
                const responseData = error.response.data;
                console.log('🔍 AuthAction: Error response data:', responseData);
                dispatch(setAuthError(responseData.message || "Failed to send reset code"));
                return { success: false, message: responseData.message || "Failed to send reset code" };
            } else {
                console.log('🔍 AuthAction: Network or other error');
                const errorMessage = "Failed to send reset code. Please try again.";
                dispatch(setAuthError(errorMessage));
                return { success: false, message: errorMessage };
            }
        } finally {
            dispatch(setAuthLoading(false));
        }
    };
};

// Reset password action
export const resetPasswordUser = (email, otp, newPassword) => {
    return async (dispatch) => {
        try {
            dispatch(setAuthLoading(true));
            dispatch(setAuthError(null));
            
            const response = await apiService({
                method: HttpMethod.POST,
                endPoint: "/public/auth/reset-password",
                data: { email, otp, newPassword }
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

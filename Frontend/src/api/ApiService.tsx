import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../utils/Constants';

// Axios interceptor for handling 401 errors (token expiry)
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('tp_portal_token');
            localStorage.removeItem('persist:root-v3');

            // Only redirect and show toast if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
                toast.error('Session expired. Please login again.');
            }
        }
        return Promise.reject(error);
    }
);

export enum HttpMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
}

interface ApiServiceProps {
    method: HttpMethod;
    endPoint: string;
    data?: any;
    token?: string | null;
    headerType?: string;
    timeout?: number;
}

const apiService = async ({
    method,
    endPoint,
    data = {},
    token = null,
    headerType = 'application/json',
    timeout = 90000,
}: ApiServiceProps) => {
    console.log(JSON.stringify({ method, endPoint, data, token, headerType }, null, 2));

    try {
        const headers = token
            ? {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': headerType,
              }
            : {
                  'Content-Type': headerType,
              };

        const config = {
            method,
            url: `${API_BASE_URL}${endPoint}`,
            headers,
            timeout,
            ...(method === HttpMethod.GET ? { params: data } : { data }),
        };

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('API Service Error:', error);
        
        if (axios.isAxiosError(error) && error.response) {
            const statusCode = error.response.status;
            const responseData = error.response.data;
            
            // Extract error message from various possible locations in the response
            const errorMessage = 
                responseData?.message || 
                responseData?.error?.message || 
                responseData?.error?.code || 
                (typeof responseData === 'string' ? responseData : null) ||
                'Something went wrong!';
            
            // Attach error message and response data to error object for easy access
            const enhancedError: any = error;
            enhancedError.apiMessage = errorMessage;
            enhancedError.apiResponse = responseData;
            enhancedError.apiStatusCode = statusCode;
            
            // For all errors with responses, throw enhanced error so Redux can access the message
            throw enhancedError;
        }
        
        // Handle timeout errors specifically
        if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.message?.includes('timeout'))) {
            const timeoutError: any = new Error('Request timeout! Please try again.');
            timeoutError.apiMessage = 'Request timeout! Please try again.';
            timeoutError.code = 'ECONNABORTED';
            timeoutError.isTimeout = true;
            throw timeoutError;
        }
        
        // Handle network errors (no response)
        if (axios.isAxiosError(error) && !error.response) {
            const networkError: any = new Error('Network error! Please check your connection.');
            networkError.apiMessage = 'Network error! Please check your connection.';
            networkError.isNetworkError = true;
            throw networkError;
        }
        
        // Handle other errors
        const unknownError: any = error instanceof Error ? error : new Error('Something went wrong!');
        unknownError.apiMessage = 'Something went wrong!';
        throw unknownError;
    }
};

export default apiService;

import { LOGIN, LOGOUT, SET_AUTH_LOADING, SET_AUTH_ERROR, UPDATE_PROFILE, GET_PROFILE } from '../ActionTypes';
import { TOKEN_KEY, USER_KEY } from '../../utils/Constants';

interface AuthState {
  user: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

const AuthReducer = (state = initialState, action: any): AuthState => {
  switch (action.type) {
    case LOGIN:
      // Store token and user data in localStorage when user logs in
      if (action.payload.token) {
        localStorage.setItem(TOKEN_KEY, action.payload.token);
      }
      if (action.payload.userData) {
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload.userData));
      }
      return {
        ...state,
        user: action.payload.userData,
        token: action.payload.token,
        isAuthenticated: true,
        error: null
      };

    case LOGOUT:
      // Clear token and user data from localStorage on logout
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return {
        ...initialState
      };

    case SET_AUTH_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case SET_AUTH_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case GET_PROFILE:
      // Update user data in localStorage when profile is fetched
      if (action.payload) {
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      }
      return {
        ...state,
        user: action.payload,
        error: null
      };

    case UPDATE_PROFILE:
      // Update user data in localStorage when profile is updated
      if (action.payload) {
        localStorage.setItem(USER_KEY, JSON.stringify(action.payload));
      }
      return {
        ...state,
        user: action.payload,
        error: null
      };

    default:
      return state;
  }
};

export default AuthReducer;

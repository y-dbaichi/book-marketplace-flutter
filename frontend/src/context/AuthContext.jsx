// ==============================================================================
// AUTHENTICATION CONTEXT
// ==============================================================================
// React Context for managing global authentication state
// Uses useReducer for predictable state updates and localStorage for persistence
//
// Features:
// - User authentication (login/register/logout)
// - Persistent authentication across page reloads
// - Profile management
// - Loading and error states
// - Type-safe state updates via actions
//
// State Management:
// - Uses React useReducer for predictable state transitions
// - Persists auth data in localStorage via authService
// - Automatic state hydration on app initialization
//
// Usage:
// Wrap your app with AuthProvider and use useAuth() hook in components
//
// Example:
// ```jsx
// function App() {
//   return (
//     <AuthProvider>
//       <YourApp />
//     </AuthProvider>
//   );
// }
//
// function MyComponent() {
//   const { user, login, logout, isAuthenticated } = useAuth();
//   // ... use auth state and functions
// }
// ```
// ==============================================================================

import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/api';

// ==============================================================================
// STATE STRUCTURE
// ==============================================================================

/**
 * Initial authentication state
 *
 * @type {Object}
 * @property {Object|null} user - Currently authenticated user object
 * @property {string|null} token - JWT authentication token
 * @property {boolean} isAuthenticated - Whether user is logged in
 * @property {boolean} isLoading - Whether auth operation is in progress
 * @property {string|null} error - Error message from last failed operation
 */
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// ==============================================================================
// ACTION TYPES
// ==============================================================================

/**
 * Redux-style action types for authentication state updates
 *
 * Ensures type-safe state transitions and makes debugging easier
 * All state changes must go through these action types
 */
const AUTH_ACTIONS = {
  // Login actions
  LOGIN_START: 'LOGIN_START',       // Login request initiated
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',   // Login successful
  LOGIN_FAILURE: 'LOGIN_FAILURE',   // Login failed

  // Logout action
  LOGOUT: 'LOGOUT',                 // User logged out

  // Register actions
  REGISTER_START: 'REGISTER_START',       // Registration initiated
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',   // Registration successful
  REGISTER_FAILURE: 'REGISTER_FAILURE',   // Registration failed

  // User loading
  LOAD_USER: 'LOAD_USER',           // Load user from storage

  // Utility actions
  CLEAR_ERROR: 'CLEAR_ERROR',       // Clear error message
  SET_LOADING: 'SET_LOADING'        // Set loading state
};

// ==============================================================================
// REDUCER
// ==============================================================================

/**
 * Authentication reducer
 *
 * Handles all authentication state updates in a predictable, immutable way
 * Each action type produces a new state object without mutating the original
 *
 * @param {Object} state - Current authentication state
 * @param {Object} action - Action object with type and optional payload
 * @returns {Object} New authentication state
 */
function authReducer(state, action) {
  switch (action.type) {
    // Start loading state for login/register
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null // Clear previous errors
      };

    // Successful authentication (login or register)
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    // Failed authentication (login or register)
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload // Error message
      };

    // User logout
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    // Load user from storage (on app initialization)
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token, // True if token exists
        isLoading: false
      };

    // Clear error message
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    // Set loading state
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    // Unknown action type
    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
}

// ==============================================================================
// CONTEXT CREATION
// ==============================================================================

/**
 * Authentication context
 *
 * Provides authentication state and functions to all child components
 * Use via useAuth() hook for type-safe access
 */
const AuthContext = createContext();

// ==============================================================================
// PROVIDER COMPONENT
// ==============================================================================

/**
 * Authentication Provider Component
 *
 * Wraps your application to provide authentication state and functions
 * to all child components via React Context.
 *
 * Features:
 * - Manages auth state with useReducer
 * - Persists auth data in localStorage
 * - Loads saved auth state on mount
 * - Provides auth functions to children
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ===========================================================================
  // INITIALIZATION EFFECT
  // ===========================================================================

  /**
   * Load user from localStorage on app start
   *
   * Runs once on component mount to restore authentication state
   * from previous sessions. If user was logged in, they remain
   * logged in across page reloads.
   */
  useEffect(() => {
    try {
      console.log('🔐 Loading saved authentication state...');

      // Get saved token and user from localStorage
      const token = authService.getToken();
      const user = authService.getCurrentUser();

      if (token && user) {
        console.log('✅ Restored authentication for:', user.email);
      } else {
        console.log('📭 No saved authentication found');
      }

      // Update state with loaded data
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER,
        payload: { user, token }
      });
    } catch (error) {
      console.error('❌ Error loading auth state:', error);

      // On error, set to logged out state
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER,
        payload: { user: null, token: null }
      });
    }
  }, []); // Empty deps - run once on mount

  // ===========================================================================
  // AUTHENTICATION FUNCTIONS
  // ===========================================================================

  /**
   * Login user with email and password
   *
   * Sends login credentials to backend, receives auth token and user data
   * Saves token and user to localStorage for persistence
   *
   * @param {Object} credentials
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Auth response with user and token
   * @throws {Error} If login fails
   *
   * @example
   * try {
   *   const response = await login({ email: 'user@example.com', password: 'pass123' });
   *   console.log('Logged in as:', response.user.email);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   */
  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login for:', credentials.email);

      // Dispatch loading state
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Call backend login API
      const response = await authService.login(credentials);

      console.log('✅ Login successful:', response.user.email);

      // Dispatch success state with user and token
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response
      });

      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);

      // Extract user-friendly error message
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Login failed. Please check your credentials.';

      // Dispatch failure state with error message
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      // Re-throw for caller to handle
      throw error;
    }
  };

  /**
   * Register new user
   *
   * Creates new user account and logs them in automatically
   * Saves token and user to localStorage for persistence
   *
   * @param {Object} userData
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @param {string} userData.userType - User type ('buyer' or 'seller')
   * @param {string} [userData.phone] - Optional phone number
   * @returns {Promise<Object>} Auth response with user and token
   * @throws {Error} If registration fails
   *
   * @example
   * try {
   *   const response = await register({
   *     email: 'newuser@example.com',
   *     password: 'securepass123',
   *     userType: 'buyer'
   *   });
   *   console.log('Registered and logged in as:', response.user.email);
   * } catch (error) {
   *   console.error('Registration failed:', error.message);
   * }
   */
  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration for:', userData.email);

      // Dispatch loading state
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      // Call backend register API
      const response = await authService.register(userData);

      console.log('✅ Registration successful:', response.user.email);

      // Dispatch success state with user and token
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: response
      });

      return response;
    } catch (error) {
      console.error('❌ Registration failed:', error);

      // Extract user-friendly error message
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Dispatch failure state with error message
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });

      // Re-throw for caller to handle
      throw error;
    }
  };

  /**
   * Logout current user
   *
   * Clears authentication data from localStorage and resets state
   * Redirects user to public pages
   */
  const logout = () => {
    try {
      console.log('🚪 Logging out user:', state.user?.email);

      // Clear localStorage and cookies
      authService.logout();

      // Reset state to logged out
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);

      // Even if logout fails, clear state for security
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  /**
   * Clear error message
   *
   * Clears the current error from state, useful for dismissing
   * error notifications after user has seen them
   */
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // ===========================================================================
  // PROFILE MANAGEMENT
  // ===========================================================================

  /**
   * Update user profile
   *
   * Updates user profile data (name, bio, location, etc.)
   * Syncs updated data to localStorage and state
   *
   * @param {Object} profileData - Profile fields to update
   * @returns {Promise<Object>} Updated user object
   * @throws {Error} If update fails
   *
   * @example
   * try {
   *   await updateProfile({
   *     profile: {
   *       firstName: 'John',
   *       lastName: 'Doe'
   *     }
   *   });
   *   console.log('Profile updated successfully');
   * } catch (error) {
   *   console.error('Profile update failed:', error.message);
   * }
   */
  const updateProfile = async (profileData) => {
    try {
      console.log('✏️ Updating user profile...');

      // Call backend update API
      const response = await authService.updateProfile(profileData);

      // Merge updated data with current user
      const updatedUser = { ...state.user, ...response.user };

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update state
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER,
        payload: { user: updatedUser, token: state.token }
      });

      console.log('✅ Profile updated successfully');

      return response;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  };

  // ===========================================================================
  // CONTEXT VALUE
  // ===========================================================================

  /**
   * Context value object
   *
   * Contains all authentication state and functions
   * Available to all child components via useAuth() hook
   */
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Functions
    login,
    register,
    logout,
    clearError,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==============================================================================
// CUSTOM HOOK
// ==============================================================================

/**
 * Custom hook to access authentication context
 *
 * Provides type-safe access to auth state and functions
 * Must be used within AuthProvider component tree
 *
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside AuthProvider
 *
 * @example
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onLogin={login} />;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user.email}!</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  // Ensure hook is used within AuthProvider
  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your component tree with <AuthProvider> to use authentication.'
    );
  }

  return context;
}

// Export context for advanced use cases
export default AuthContext;

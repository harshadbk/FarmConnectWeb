import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth-token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user from token on mount
  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, []);

  const loadUser = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const userData = await authAPI.getUser();
      setUser(userData);
      if (userData?.latitude != null) {
        localStorage.setItem('user-lat', userData.latitude);
      }
      if (userData?.longitude != null) {
        localStorage.setItem('user-lon', userData.longitude);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load user:', err);
      setError(err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      
      if (!response.success) {
        throw new Error(response.errors || 'Login failed');
      }

      const roleValue = response.user?.role || response.user?.role || localStorage.getItem('role') || '';
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('user-email', response.user.email);
      localStorage.setItem('user-name', response.user.name);
      if (response.user?.latitude != null) {
        localStorage.setItem('user-lat', response.user.latitude);
      }
      if (response.user?.longitude != null) {
        localStorage.setItem('user-lon', response.user.longitude);
      }
      if (roleValue) {
        localStorage.setItem('role', roleValue);
      }
      
      setToken(response.token);
      setUser(response.user);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      // Get location if available
      let locationData = { latitude: 0, longitude: 0 };
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
            });
          });
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (locErr) {
          console.warn('Geolocation not available:', locErr);
        }
      }

      const signupData = { ...userData, ...locationData };
      const response = await authAPI.signup(signupData);

      if (!response.success) {
        throw new Error(response.errors || 'Signup failed');
      }

      const roleValue = response.user?.role || userData.role || '';
      localStorage.setItem('auth-token', response.token);
      localStorage.setItem('user-email', response.user.email);
      localStorage.setItem('user-name', response.user.name);
      if (response.user?.latitude != null) {
        localStorage.setItem('user-lat', response.user.latitude);
      }
      if (response.user?.longitude != null) {
        localStorage.setItem('user-lon', response.user.longitude);
      }
      if (roleValue) {
        localStorage.setItem('role', roleValue);
      }
      
      setToken(response.token);
      setUser(response.user);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-email');
    localStorage.removeItem('user-name');
    localStorage.removeItem('user-lat');
    localStorage.removeItem('user-lon');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        signup,
        logout,
        loadUser,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;

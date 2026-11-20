import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

const AuthContext = createContext(null);

const decodeJwtPayload = (token) => {
  const encodedPayload = token?.split('.')[1];
  if (!encodedPayload) throw new Error('The server returned an invalid session token.');

  const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binaryPayload = atob(paddedBase64);
  const bytes = Uint8Array.from(binaryPayload, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const getRequestError = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || String(item)).join(' ');
  }
  if (error.request) return 'Unable to reach the HealthForesight service. Check that the backend is running.';
  return error.message || fallback;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in on mount
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      // Prepare form data for OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token } = response.data;
      
      const payload = decodeJwtPayload(access_token);
      const userData = {
        username: payload.sub,
        role: payload.role,
        email: payload.email,
        id: payload.id
      };
      
      // Store token and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: getRequestError(error, 'Invalid credentials')
      };
    }
  };

  const signup = async (userData) => {
    try {
      // Use /auth/register for public patient/doctor registration
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { access_token } = response.data;
      
      const payload = decodeJwtPayload(access_token);
      const newUser = {
        username: payload.sub,
        role: payload.role,
        email: payload.email,
        id: payload.id
      };
      
      // Store token and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(access_token);
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: getRequestError(error, 'Signup failed. Please try again.')
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

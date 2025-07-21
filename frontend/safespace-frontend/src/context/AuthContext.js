import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  loginUser, 
  loginUserWithMobile,
  loginUserWithEmailOTP,
  verifyEmailOTP,
  loginUserWithMobileOTP,
  verifyMobileOTP,
  registerUser, 
  logoutUser, 
  getCurrentUser,
  updateProfile,
  forgotPassword,
  resetPassword
} from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Checking auth status...'); // Debug log
      const response = await getCurrentUser();
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('User authenticated:', response.user.email); // Debug log
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('User not authenticated'); // Debug log
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on any state

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('Login attempt:', { email, apiUrl: process.env.REACT_APP_API_URL }); // Debug log
      const response = await loginUser(email, password);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Welcome back! 🎉');
        return { success: true };
      } else {
        console.error('Login failed:', response.message); // Debug log
        toast.error(response.message || 'Login failed');
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Login error:', error); // Debug log
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile + Password Login
  const loginWithMobile = async (mobile, password) => {
    try {
      setIsLoading(true);
      const response = await loginUserWithMobile(mobile, password);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Welcome back! 🎉');
        return { success: true };
      } else {
        toast.error(response.message || 'Mobile login failed');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Mobile login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Email + OTP Login
  const sendEmailOTP = async (email) => {
    try {
      setIsLoading(true);
      const response = await loginUserWithEmailOTP(email);
      
      if (response.success) {
        toast.success('OTP sent to your email! 📧');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to send OTP');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmailOTP = async (email, otp) => {
    try {
      setIsLoading(true);
      const response = await verifyEmailOTP(email, otp);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Welcome back! 🎉');
        return { success: true };
      } else {
        toast.error(response.message || 'Invalid OTP');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid OTP';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile + OTP Login
  const sendMobileOTP = async (mobile) => {
    try {
      setIsLoading(true);
      const response = await loginUserWithMobileOTP(mobile);
      
      if (response.success) {
        toast.success('OTP sent to your mobile! 📱');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to send OTP');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMobileOTP = async (mobile, otp) => {
    try {
      setIsLoading(true);
      const response = await verifyMobileOTP(mobile, otp);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Welcome back! 🎉');
        return { success: true };
      } else {
        toast.error(response.message || 'Invalid OTP');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid OTP';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await registerUser(userData);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Account created successfully! 🎉');
        return { success: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null);
      setIsAuthenticated(false);
      toast.error('Logout failed, but you are logged out locally');
    }
  };

  const updateUserProfile = async (updateData) => {
    try {
      setIsLoading(true);
      const response = await updateProfile(updateData);
      
      if (response.success) {
        setUser(response.user);
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const sendForgotPasswordEmail = async (email) => {
    try {
      setIsLoading(true);
      const response = await forgotPassword(email);
      
      if (response.success) {
        toast.success('Password reset email sent! 📧');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to send reset email');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserPassword = async (email, newPassword, token) => {
    try {
      setIsLoading(true);
      const response = await resetPassword(email, newPassword, token);
      
      if (response.success) {
        toast.success('Password reset successfully! 🎉');
        return { success: true };
      } else {
        toast.error(response.message || 'Password reset failed');
        return { success: false, error: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile: updateUserProfile,
    checkAuthStatus,
    loginWithMobile,
    sendEmailOTP,
    loginWithEmailOTP,
    sendMobileOTP,
    loginWithMobileOTP,
    sendForgotPasswordEmail,
    resetUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

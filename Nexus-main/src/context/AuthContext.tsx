import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import toast from 'react-hot-toast';
import api from '../lib/axios';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';
const TOKEN_KEY = 'business_nexus_token';

// Helper to map backend user object to frontend User type
const mapUserData = (backendUser: any): User => ({
  id: backendUser._id || backendUser.id,
  name: backendUser.name,
  email: backendUser.email,
  role: backendUser.role as UserRole,
  avatarUrl: backendUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.name)}&background=random`,
  bio: backendUser.bio || '',
  isOnline: true,
  createdAt: backendUser.createdAt || new Date().toISOString()
});

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token and fetch user data on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            const mappedUser = mapUserData(response.data.user);
            setUser(mappedUser);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          logout(); // Clear invalid token
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Login function - restored for standard & optional 2FA support 🔐
  const login = async (email: string, password: string, _role: UserRole): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // 1. Check for 2FA requirement (Strictly Optional) 🛡️
      if (response.data.require2FA) {
        return { require2FA: true, userId: response.data.userId };
      }

      // 2. Standard login success ✅
      if (response.data.success) {
        const mappedUser = mapUserData(response.data.user);
        const { token } = response.data;
        
        setUser(mappedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
        localStorage.setItem(TOKEN_KEY, token);
        
        toast.success(`Welcome back, ${mappedUser.name}!`);
        return { success: true };
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed. Please check your credentials.';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - connected to backend
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      
      if (response.data.success) {
        const mappedUser = mapUserData(response.data.user);
        const { token } = response.data;
        
        setUser(mappedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
        localStorage.setItem(TOKEN_KEY, token);
        
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock forgot password function
  const forgotPassword = async (_email: string): Promise<void> => {
    try {
      // Simulate API call delay for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Mock reset password function
  const resetPassword = async (_token: string, _newPassword: string): Promise<void> => {
    try {
      // Simulate API call delay for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    toast.success('Logged out successfully');
  };

  // Verify 2FA function 🔐
  const verify2FA = async (userId: string, code: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-2fa', { userId, code });
      if (response.data.success) {
        const mappedUser = mapUserData(response.data.user);
        const { token } = response.data;
        
        setUser(mappedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
        localStorage.setItem(TOKEN_KEY, token);
        
        toast.success(`Identity Verified. Welcome, ${mappedUser.name}!`);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Verification failed.';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (_userId: string, updates: Partial<User>): Promise<void> => {
    setIsLoading(true);
    try {
      // Update local state
      const updatedUser = { ...user!, ...updates };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Profile update failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    verify2FA,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
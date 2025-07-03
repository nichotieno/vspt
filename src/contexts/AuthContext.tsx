"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { createUserInDb, logInUser } from '@/app/actions';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, name: string) => Promise<any>;
  logOut: () => Promise<any>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = 'stocksim-user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const logIn = async (email: string, pass: string) => {
    const result = await logInUser(email, pass);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      return result;
    } else {
      throw new Error(result.error || 'Login failed.');
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const result = await createUserInDb(email, name, pass);
    if (result.success) {
      // Don't auto-login, let them go to the login page.
      return result;
    } else {
      throw new Error(result.error || 'Signup failed.');
    }
  };

  const logOut = async () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const value = {
    user,
    loading,
    logIn,
    signUp,
    logOut,
    setUser
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

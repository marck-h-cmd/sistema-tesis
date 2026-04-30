'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/endpoints';
import type { User, LoginCredentials, RegisterData } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = Cookies.get('user');
    const token = Cookies.get('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        Cookies.remove('user');
        Cookies.remove('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      const { access_token, user } = response.data.data;
      
      Cookies.set('token', access_token, { expires: 1 });
      Cookies.set('user', JSON.stringify(user), { expires: 1 });
      
      setUser(user);
      toast.success('Inicio de sesión exitoso');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      const { access_token, user } = response.data.data;
      
      Cookies.set('token', access_token, { expires: 1 });
      Cookies.set('user', JSON.stringify(user), { expires: 1 });
      
      setUser(user);
      toast.success('Registro exitoso');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrarse';
      toast.error(message);
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    Cookies.remove('token');
    Cookies.remove('user');
    setUser(null);
    router.push('/login');
    toast.success('Sesión cerrada');
  }, [router]);

  const hasRole = useCallback((role: string) => {
    return user?.roles?.includes(role as any) || false;
  }, [user]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
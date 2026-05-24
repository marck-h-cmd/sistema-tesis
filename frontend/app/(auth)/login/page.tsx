'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

const TEST_CREDENTIALS = [
  { label: 'Admin', email: 'admin@unitru.edu.pe', password: 'Admin123@' },
  { label: 'Estudiante', email: 'carlos.lopez@unitru.edu.pe', password: 'Estu123@' },
  { label: 'Asesor', email: 'juan.garcia@unitru.edu.pe', password: 'Asesor123@' },
  { label: 'Secretaria', email: 'secretaria.sistemas@unitru.edu.pe', password: 'Secre123@' },
  { label: 'Empresa', email: 'rrhh@techcorp.com', password: 'Empresa123@' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (cred: typeof TEST_CREDENTIALS[number]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Sistema UNT</CardTitle>
          <CardDescription>
            Gestión de Prácticas Preprofesionales y Tesis
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@unitru.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Credenciales de prueba */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Credenciales de prueba
              </p>
              <div className="flex flex-col gap-1.5">
                {TEST_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.label}
                    type="button"
                    onClick={() => fillCredentials(cred)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-left group"
                  >
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                      {cred.label}
                    </span>
                    <span className="text-xs text-gray-400 group-hover:text-blue-500 font-mono truncate ml-2">
                      {cred.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Registrarse
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
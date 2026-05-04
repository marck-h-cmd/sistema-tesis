'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useFormValidation, validators } from '@/lib/hooks/useFormValidation';
import { FieldWrapper } from '@/components/ui/FieldWrapper';

// ─── Validation rules ─────────────────────────────────────────────────────────

const rules = {
  nombres: [validators.required('Los nombres'), validators.minLength(2, 'Los nombres')],
  apellidos: [validators.required('Los apellidos'), validators.minLength(2, 'Los apellidos')],
  email: [validators.required('El correo'), validators.email()],
  dni: [validators.required('El DNI'), validators.dni()],
  telefono: [validators.phone()],
  password: [validators.required('La contraseña'), validators.password()],
  confirmPassword: [
    validators.required('La confirmación'),
    validators.matchField('password'),
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    dni: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { register } = useAuth();

  const { handleChange, handleBlur, validateAll, getFieldError, isFieldValid } =
    useFormValidation(rules);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toStringValues = () =>
    Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, String(v)]),
    );

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    handleChange(name, value, { ...toStringValues(), [name]: value });
  };

  const onFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleBlur(name, value, toStringValues());
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateAll(toStringValues())) return;

    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary flex items-center mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio de sesión
          </Link>
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">
            Regístrate en el Sistema de Gestión UNT
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper
                label="Nombres"
                required
                error={getFieldError('nombres')}
                success={isFieldValid('nombres', formData.nombres)}
              >
                <Input
                  name="nombres"
                  value={formData.nombres}
                  onChange={onFieldChange}
                  onBlur={onFieldBlur}
                  placeholder="Juan"
                />
              </FieldWrapper>

              <FieldWrapper
                label="Apellidos"
                required
                error={getFieldError('apellidos')}
                success={isFieldValid('apellidos', formData.apellidos)}
              >
                <Input
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={onFieldChange}
                  onBlur={onFieldBlur}
                  placeholder="Pérez García"
                />
              </FieldWrapper>
            </div>

            <FieldWrapper
              label="Correo Electrónico"
              required
              error={getFieldError('email')}
              success={isFieldValid('email', formData.email)}
            >
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={onFieldChange}
                onBlur={onFieldBlur}
                placeholder="correo@ejemplo.com"
              />
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper
                label="DNI"
                required
                error={getFieldError('dni')}
                success={isFieldValid('dni', formData.dni)}
                hint="8 dígitos"
              >
                <Input
                  name="dni"
                  maxLength={8}
                  value={formData.dni}
                  onChange={onFieldChange}
                  onBlur={onFieldBlur}
                  placeholder="12345678"
                />
              </FieldWrapper>

              <FieldWrapper
                label="Teléfono"
                error={getFieldError('telefono')}
                success={isFieldValid('telefono', formData.telefono)}
                hint="9 dígitos (opcional)"
              >
                <Input
                  name="telefono"
                  maxLength={9}
                  value={formData.telefono}
                  onChange={onFieldChange}
                  onBlur={onFieldBlur}
                  placeholder="987654321"
                />
              </FieldWrapper>
            </div>

            <FieldWrapper
              label="Contraseña"
              required
              error={getFieldError('password')}
              success={isFieldValid('password', formData.password)}
              hint="Mínimo 8 caracteres, una mayúscula y un número"
            >
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={onFieldChange}
                  onBlur={onFieldBlur}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldWrapper>

            {/* Password strength bar */}
            {formData.password && (
              <PasswordStrength password={formData.password} />
            )}

            <FieldWrapper
              label="Confirmar Contraseña"
              required
              error={getFieldError('confirmPassword')}
              success={isFieldValid('confirmPassword', formData.confirmPassword)}
            >
              <Input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={onFieldChange}
                onBlur={onFieldBlur}
                placeholder="••••••••"
              />
            </FieldWrapper>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ caracteres', ok: password.length >= 8 },
    { label: 'Mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Número', ok: /[0-9]/.test(password) },
    { label: 'Especial', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];
  const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte'];

  return (
    <div className="space-y-2 -mt-2">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-xs transition-colors ${c.ok ? 'text-green-600' : 'text-gray-400'}`}
            >
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-medium ${colors[score - 1].replace('bg-', 'text-')}`}>
            {labels[score - 1]}
          </span>
        )}
      </div>
    </div>
  );
}
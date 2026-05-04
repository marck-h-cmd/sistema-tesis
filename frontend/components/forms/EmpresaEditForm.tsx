'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const empresaSchema = z.object({
  razon_social: z.string().min(1, 'La razón social es requerida'),
  ruc: z.string().min(11, 'El RUC debe tener 11 dígitos').max(11, 'El RUC debe tener 11 dígitos'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido'),
  descripcion: z.string().optional(),
  sitio_web: z.string().url('URL inválida').optional().or(z.literal('')),
  sector: z.string().min(1, 'El sector es requerido'),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EmpresaEditFormProps {
  empresa: any;
  onSubmit: (data: EmpresaFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmpresaEditForm({ empresa, onSubmit, onCancel, isLoading }: EmpresaEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      razon_social: empresa.razon_social,
      ruc: empresa.ruc,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      email: empresa.email,
      descripcion: empresa.descripcion,
      sitio_web: empresa.sitio_web,
      sector: empresa.sector,
    },
  });

  const handleFormSubmit = (data: EmpresaFormData) => {
    // Convert empty string to undefined for sitio_web
    const submitData = {
      ...data,
      sitio_web: data.sitio_web || undefined,
    };
    onSubmit(submitData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social</Label>
              <Input
                id="razon_social"
                {...register('razon_social')}
                placeholder="Nombre de la empresa"
              />
              {errors.razon_social && (
                <p className="text-sm text-red-600">{errors.razon_social.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruc">RUC</Label>
              <Input
                id="ruc"
                {...register('ruc')}
                placeholder="12345678901"
                maxLength={11}
              />
              {errors.ruc && (
                <p className="text-sm text-red-600">{errors.ruc.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...register('direccion')}
              placeholder="Dirección completa de la empresa"
            />
            {errors.direccion && (
              <p className="text-sm text-red-600">{errors.direccion.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...register('telefono')}
                placeholder="+51 123 456 789"
              />
              {errors.telefono && (
                <p className="text-sm text-red-600">{errors.telefono.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contacto@empresa.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sitio_web">Sitio Web</Label>
              <Input
                id="sitio_web"
                {...register('sitio_web')}
                placeholder="https://www.empresa.com"
              />
              {errors.sitio_web && (
                <p className="text-sm text-red-600">{errors.sitio_web.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                {...register('sector')}
                placeholder="Tecnología, Manufactura, etc."
              />
              {errors.sector && (
                <p className="text-sm text-red-600">{errors.sector.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Descripción de la empresa..."
              rows={3}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-600">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
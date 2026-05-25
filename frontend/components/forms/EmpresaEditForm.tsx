'use client';

/**
 * Alineado con CreateEmpresaDto / UpdateEmpresaDto del backend (sin sector, descripción ni sitio web).
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const empresaSchema = z.object({
  razon_social: z.string().min(1, 'La razón social es requerida'),
  ruc: z.string().length(11, 'El RUC debe tener 11 dígitos'),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  email_contacto: z.string().email('Email inválido').optional().or(z.literal('')),
  representante: z.string().optional(),
  convenio_activo: z.boolean().optional(),
});

export type EmpresaEditFormData = z.infer<typeof empresaSchema>;

interface EmpresaEditFormProps {
  empresa: {
    razon_social?: string;
    ruc?: string;
    direccion?: string | null;
    telefono?: string | null;
    email_contacto?: string | null;
    /** compat listing viejo */
    email?: string | null;
    representante?: string | null;
    convenio_activo?: boolean;
  };
  onSubmit: (data: EmpresaEditFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmpresaEditForm({ empresa, onSubmit, onCancel, isLoading }: EmpresaEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmpresaEditFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      razon_social: empresa.razon_social ?? '',
      ruc: empresa.ruc ?? '',
      direccion: empresa.direccion ?? '',
      telefono: empresa.telefono ?? '',
      email_contacto: empresa.email_contacto ?? empresa.email ?? '',
      representante: empresa.representante ?? '',
      convenio_activo: empresa.convenio_activo ?? false,
    },
  });

  const submit = (data: EmpresaEditFormData) => {
    onSubmit({
      razon_social: data.razon_social,
      ruc: data.ruc,
      ...(data.direccion?.trim() ? { direccion: data.direccion.trim() } : {}),
      ...(data.telefono?.trim() ? { telefono: data.telefono.trim() } : {}),
      ...(data.email_contacto?.trim()
        ? { email_contacto: data.email_contacto.trim() }
        : {}),
      ...(data.representante?.trim() ? { representante: data.representante.trim() } : {}),
      ...(data.convenio_activo !== undefined ? { convenio_activo: data.convenio_activo } : {}),
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón social</Label>
              <Input id="razon_social" {...register('razon_social')} />
              {errors.razon_social && (
                <p className="text-sm text-red-600">{errors.razon_social.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruc">RUC</Label>
              <Input id="ruc" {...register('ruc')} maxLength={11} placeholder="12345678901" />
              {errors.ruc && <p className="text-sm text-red-600">{errors.ruc.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...register('direccion')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...register('telefono')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_contacto">Email de contacto</Label>
              <Input id="email_contacto" type="email" {...register('email_contacto')} />
              {errors.email_contacto && (
                <p className="text-sm text-red-600">{errors.email_contacto.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="representante">Representante</Label>
            <Input id="representante" {...register('representante')} />
          </div>

          <div className="flex items-center gap-2">
            <Controller
              name="convenio_activo"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value ?? false}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  Convenio activo
                </label>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

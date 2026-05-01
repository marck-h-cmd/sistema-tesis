'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

interface EmpresaFormData {
  ruc: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email_contacto: string;
  representante: string;
  convenio_activo: boolean;
}

interface EmpresaFormProps {
  onSubmit: (data: EmpresaFormData) => Promise<void>;
  initialData?: Partial<EmpresaFormData>;
  isLoading?: boolean;
}

export function EmpresaForm({ onSubmit, initialData, isLoading = false }: EmpresaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpresaFormData>({
    defaultValues: {
      convenio_activo: false,
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ruc">RUC *</Label>
          <Input
            id="ruc"
            {...register('ruc', { required: 'El RUC es requerido' })}
            maxLength={11}
            placeholder="20123456789"
          />
          {errors.ruc && (
            <p className="text-sm text-red-600">{errors.ruc.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="razon_social">Razón Social *</Label>
          <Input
            id="razon_social"
            {...register('razon_social', { required: 'La razón social es requerida' })}
            placeholder="Empresa XYZ S.A.C."
          />
          {errors.razon_social && (
            <p className="text-sm text-red-600">{errors.razon_social.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          {...register('direccion')}
          placeholder="Av. Principal 123"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            {...register('telefono')}
            placeholder="999888777"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email_contacto">Email de contacto</Label>
          <Input
            id="email_contacto"
            type="email"
            {...register('email_contacto')}
            placeholder="contacto@empresa.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="representante">Representante</Label>
        <Input
          id="representante"
          {...register('representante')}
          placeholder="Nombre del representante"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="convenio_activo"
          {...register('convenio_activo')}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="convenio_activo">Tiene convenio activo</Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Empresa
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
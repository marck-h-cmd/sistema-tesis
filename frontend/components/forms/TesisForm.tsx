'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tesisSchema, type TesisFormData } from '@/lib/utils/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

interface TesisFormProps {
  onSubmit: (data: TesisFormData) => Promise<void>;
  initialData?: Partial<TesisFormData>;
  isLoading?: boolean;
}

export function TesisForm({ onSubmit, initialData, isLoading = false }: TesisFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TesisFormData>({
    resolver: zodResolver(tesisSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título de la tesis *</Label>
        <Input
          id="titulo"
          {...register('titulo')}
          placeholder="Ej: Sistema de Gestión de Prácticas Preprofesionales"
        />
        {errors.titulo && (
          <p className="text-sm text-red-600">{errors.titulo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="resumen">Resumen</Label>
        <Textarea
          id="resumen"
          {...register('resumen')}
          rows={4}
          placeholder="Resumen del proyecto de tesis..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estudiante_id">ID Estudiante *</Label>
          <Input
            id="estudiante_id"
            type="number"
            {...register('estudiante_id', { valueAsNumber: true })}
          />
          {errors.estudiante_id && (
            <p className="text-sm text-red-600">{errors.estudiante_id.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="asesor_principal_id">ID Asesor Principal *</Label>
          <Input
            id="asesor_principal_id"
            type="number"
            {...register('asesor_principal_id', { valueAsNumber: true })}
          />
          {errors.asesor_principal_id && (
            <p className="text-sm text-red-600">{errors.asesor_principal_id.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
        <Input
          id="fecha_inicio"
          type="date"
          {...register('fecha_inicio')}
        />
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
              Registrar Tesis
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
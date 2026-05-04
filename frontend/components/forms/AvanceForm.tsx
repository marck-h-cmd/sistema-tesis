'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { avanceSchema, type AvanceFormData } from '@/lib/utils/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

interface AvanceFormProps {
  onSubmit: (data: AvanceFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AvanceForm({ onSubmit, isLoading = false }: AvanceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AvanceFormData>({
    resolver: zodResolver(avanceSchema),
    defaultValues: {
      tipo: '',
      descripcion: '',
      fecha_entrega: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de avance *</Label>
        <Input
          id="tipo"
          {...register('tipo')}
          placeholder="Ej: Capítulo 1, propuesta, diseño" 
        />
        {errors.tipo && (
          <p className="text-sm text-red-600">{errors.tipo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          {...register('descripcion')}
          rows={5}
          placeholder="Describe lo avanzado, resultados y tareas pendientes..."
        />
        {errors.descripcion && (
          <p className="text-sm text-red-600">{errors.descripcion.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fecha_entrega">Fecha de entrega *</Label>
        <Input id="fecha_entrega" type="date" {...register('fecha_entrega')} />
        {errors.fecha_entrega && (
          <p className="text-sm text-red-600">{errors.fecha_entrega.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Registrar Avance
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

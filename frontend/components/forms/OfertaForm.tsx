'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ofertaSchema, type OfertaFormData } from '@/lib/utils/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

interface OfertaFormProps {
  onSubmit: (data: OfertaFormData) => Promise<void>;
  initialData?: Partial<OfertaFormData>;
  isLoading?: boolean;
}

export function OfertaForm({ onSubmit, initialData, isLoading = false }: OfertaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OfertaFormData>({
    resolver: zodResolver(ofertaSchema),
    defaultValues: {
      empresa_id: 1,
      vacantes: 1,
      modalidad: 'presencial',
      ...initialData,
    },
  });

  const modalidadOptions = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'remota', label: 'Remota' },
    { value: 'hibrida', label: 'Híbrida' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título de la oferta *</Label>
        <Input
          id="titulo"
          {...register('titulo')}
          placeholder="Ej: Practicante de Desarrollo Web"
        />
        {errors.titulo && (
          <p className="text-sm text-red-600">{errors.titulo.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          {...register('descripcion')}
          rows={4}
          placeholder="Describe las actividades y responsabilidades..."
        />
        {errors.descripcion && (
          <p className="text-sm text-red-600">{errors.descripcion.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="requisitos">Requisitos</Label>
        <Textarea
          id="requisitos"
          {...register('requisitos')}
          rows={3}
          placeholder="Conocimientos y habilidades requeridas..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fecha_inicio">Fecha de inicio *</Label>
          <Input
            id="fecha_inicio"
            type="date"
            {...register('fecha_inicio')}
          />
          {errors.fecha_inicio && (
            <p className="text-sm text-red-600">{errors.fecha_inicio.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha_fin">Fecha de fin *</Label>
          <Input
            id="fecha_fin"
            type="date"
            {...register('fecha_fin')}
          />
          {errors.fecha_fin && (
            <p className="text-sm text-red-600">{errors.fecha_fin.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vacantes">Vacantes *</Label>
          <Input
            id="vacantes"
            type="number"
            min={1}
            {...register('vacantes', { valueAsNumber: true })}
          />
          {errors.vacantes && (
            <p className="text-sm text-red-600">{errors.vacantes.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="modalidad">Modalidad *</Label>
          <Select
            id="modalidad"
            options={modalidadOptions}
            {...register('modalidad')}
          />
          {errors.modalidad && (
            <p className="text-sm text-red-600">{errors.modalidad.message}</p>
          )}
        </div>
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
              Guardar Oferta
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
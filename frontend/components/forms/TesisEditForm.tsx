'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const tesisSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  resumen: z.string().min(1, 'El resumen es requerido'),
  objetivo_general: z.string().min(1, 'El objetivo general es requerido'),
  objetivos_especificos: z.string().min(1, 'Los objetivos específicos son requeridos'),
  metodologia: z.string().min(1, 'La metodología es requerida'),
  estado: z.enum(['propuesta', 'aprobada', 'en_desarrollo', 'revision', 'defensa', 'aprobada', 'rechazada']),
});

type TesisFormData = z.infer<typeof tesisSchema>;

interface TesisEditFormProps {
  tesis: any;
  onSubmit: (data: TesisFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TesisEditForm({ tesis, onSubmit, onCancel, isLoading }: TesisEditFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TesisFormData>({
    resolver: zodResolver(tesisSchema),
    defaultValues: {
      titulo: tesis.titulo,
      resumen: tesis.resumen,
      objetivo_general: tesis.objetivo_general,
      objetivos_especificos: tesis.objetivos_especificos,
      metodologia: tesis.metodologia,
      estado: tesis.estado,
    },
  });

  const handleFormSubmit = (data: TesisFormData) => {
    onSubmit(data);
  };

  const estados = [
    { value: 'propuesta', label: 'Propuesta' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'en_desarrollo', label: 'En Desarrollo' },
    { value: 'revision', label: 'En Revisión' },
    { value: 'defensa', label: 'En Defensa' },
    { value: 'completada', label: 'Completada' },
    { value: 'rechazada', label: 'Rechazada' },
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Tesis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              {...register('titulo')}
              placeholder="Título de la tesis"
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
              placeholder="Resumen de la tesis..."
              rows={4}
            />
            {errors.resumen && (
              <p className="text-sm text-red-600">{errors.resumen.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivo_general">Objetivo General</Label>
            <Textarea
              id="objetivo_general"
              {...register('objetivo_general')}
              placeholder="Objetivo general de la tesis..."
              rows={3}
            />
            {errors.objetivo_general && (
              <p className="text-sm text-red-600">{errors.objetivo_general.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="objetivos_especificos">Objetivos Específicos</Label>
            <Textarea
              id="objetivos_especificos"
              {...register('objetivos_especificos')}
              placeholder="Objetivos específicos de la tesis..."
              rows={4}
            />
            {errors.objetivos_especificos && (
              <p className="text-sm text-red-600">{errors.objetivos_especificos.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodologia">Metodología</Label>
            <Textarea
              id="metodologia"
              {...register('metodologia')}
              placeholder="Metodología de la investigación..."
              rows={4}
            />
            {errors.metodologia && (
              <p className="text-sm text-red-600">{errors.metodologia.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              id="estado"
              className="w-full"
              value={watch('estado')}
              options={[
                { value: '', label: 'Seleccionar estado' },
                ...estados,
              ]}
              onChange={(e) => setValue('estado', e.target.value as any)}
            />
            {errors.estado && (
              <p className="text-sm text-red-600">{errors.estado.message}</p>
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
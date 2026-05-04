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

const practicaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  requisitos: z.string().min(1, 'Los requisitos son requeridos'),
  ubicacion: z.string().min(1, 'La ubicación es requerida'),
  modalidad: z.enum(['presencial', 'remota', 'hibrida']),
  duracion_meses: z.number().min(1, 'La duración debe ser al menos 1 mes'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
  vacantes: z.number().min(1, 'Debe haber al menos 1 vacante'),
  salario: z.number().optional(),
});

type PracticaFormData = z.infer<typeof practicaSchema>;

interface PracticaEditFormProps {
  practica: any;
  onSubmit: (data: PracticaFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PracticaEditForm({ practica, onSubmit, onCancel, isLoading }: PracticaEditFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PracticaFormData>({
    resolver: zodResolver(practicaSchema),
    defaultValues: {
      titulo: practica.titulo,
      descripcion: practica.descripcion,
      requisitos: practica.requisitos,
      ubicacion: practica.ubicacion,
      modalidad: practica.modalidad,
      duracion_meses: practica.duracion_meses,
      fecha_inicio: practica.fecha_inicio?.split('T')[0],
      fecha_fin: practica.fecha_fin?.split('T')[0],
      vacantes: practica.vacantes,
      salario: practica.salario,
    },
  });

  const handleFormSubmit = (data: PracticaFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Práctica Preprofesional</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Título de la práctica"
              />
              {errors.titulo && (
                <p className="text-sm text-red-600">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                {...register('ubicacion')}
                placeholder="Ciudad, Provincia"
              />
              {errors.ubicacion && (
                <p className="text-sm text-red-600">{errors.ubicacion.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Describe las actividades y responsabilidades..."
              rows={4}
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
              placeholder="Requisitos necesarios para postular..."
              rows={3}
            />
            {errors.requisitos && (
              <p className="text-sm text-red-600">{errors.requisitos.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modalidad">Modalidad</Label>
              <Select
              id="modalidad"
              className="w-full"
              value={watch('modalidad')}
              options={[
                { value: '', label: 'Seleccionar modalidad' },
                { value: 'presencial', label: 'Presencial' },
                { value: 'remota', label: 'Remota' },
                { value: 'hibrida', label: 'Híbrida' },
              ]}
              onChange={(e) => setValue('modalidad', e.target.value as any)}
            />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracion_meses">Duración (meses)</Label>
              <Input
                id="duracion_meses"
                type="number"
                {...register('duracion_meses', { valueAsNumber: true })}
                placeholder="6"
              />
              {errors.duracion_meses && (
                <p className="text-sm text-red-600">{errors.duracion_meses.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
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
              <Label htmlFor="fecha_fin">Fecha de Fin</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vacantes">Vacantes Disponibles</Label>
              <Input
                id="vacantes"
                type="number"
                {...register('vacantes', { valueAsNumber: true })}
                placeholder="5"
              />
              {errors.vacantes && (
                <p className="text-sm text-red-600">{errors.vacantes.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario">Salario (opcional)</Label>
              <Input
                id="salario"
                type="number"
                {...register('salario', { valueAsNumber: true })}
                placeholder="1500"
              />
              {errors.salario && (
                <p className="text-sm text-red-600">{errors.salario.message}</p>
              )}
            </div>
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
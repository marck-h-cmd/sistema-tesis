'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const estudianteSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son requeridos'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  codigo_estudiante: z.string().min(1, 'El código de estudiante es requerido'),
  escuela_id: z.number().min(1, 'La escuela es requerida'),
});

type EstudianteFormData = z.infer<typeof estudianteSchema>;

interface EstudianteEditFormProps {
  estudiante: any;
  escuelas: any[];
  onSubmit: (data: EstudianteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EstudianteEditForm({ estudiante, escuelas, onSubmit, onCancel, isLoading }: EstudianteEditFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EstudianteFormData>({
    resolver: zodResolver(estudianteSchema),
    defaultValues: {
      nombres: estudiante.usuario?.nombres,
      apellidos: estudiante.usuario?.apellidos,
      email: estudiante.usuario?.email,
      telefono: estudiante.usuario?.telefono,
      codigo_estudiante: estudiante.codigo_estudiante,
      escuela_id: estudiante.escuela_id,
    },
  });

  const handleFormSubmit = (data: EstudianteFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Estudiante</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                {...register('nombres')}
                placeholder="Nombres del estudiante"
              />
              {errors.nombres && (
                <p className="text-sm text-red-600">{errors.nombres.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                {...register('apellidos')}
                placeholder="Apellidos del estudiante"
              />
              {errors.apellidos && (
                <p className="text-sm text-red-600">{errors.apellidos.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@unitru.edu.pe"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_estudiante">Código de Estudiante</Label>
              <Input
                id="codigo_estudiante"
                {...register('codigo_estudiante')}
                placeholder="20240001"
              />
              {errors.codigo_estudiante && (
                <p className="text-sm text-red-600">{errors.codigo_estudiante.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="escuela_id">Escuela Profesional</Label>
              <Select
                id="escuela_id"
                className="w-full"
                value={watch('escuela_id')?.toString()}
                options={[
                  { value: '', label: 'Seleccionar escuela' },
                  ...escuelas.map((escuela) => ({
                    value: escuela.id.toString(),
                    label: escuela.nombre,
                  })),
                ]}
                onChange={(e) => setValue('escuela_id', parseInt(e.target.value))}
              />
              {errors.escuela_id && (
                <p className="text-sm text-red-600">{errors.escuela_id.message}</p>
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
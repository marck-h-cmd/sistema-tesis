'use client';

/**
 * Edición de **oferta de práctica** (`OfertaPractica`), alineado con CreateOfertaDto / UpdateOfertaDto.
 * No incluye campos legacy (ubicación, duración en meses, salario) que el API rechaza.
 */

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

const ofertaEditSchema = z.object({
  empresa_id: z.number().min(1, 'Empresa requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  requisitos: z.string().optional(),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  fecha_fin: z.string().min(1, 'La fecha de fin es requerida'),
  vacantes: z.number().min(1, 'Debe haber al menos 1 vacante'),
  modalidad: z.enum(['presencial', 'remota', 'hibrida']),
});

export type OfertaEditFormData = z.infer<typeof ofertaEditSchema>;

interface PracticaEditFormProps {
  /** Objeto oferta (lista prácticas usa `ofertas`) */
  practica: {
    empresa_id?: number;
    empresa?: { id?: number };
    titulo?: string;
    descripcion?: string;
    requisitos?: string | null;
    fecha_inicio?: string;
    fecha_fin?: string;
    vacantes?: number;
    modalidad?: string;
  };
  onSubmit: (data: OfertaEditFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PracticaEditForm({ practica, onSubmit, onCancel, isLoading }: PracticaEditFormProps) {
  const empresaId = practica.empresa_id ?? practica.empresa?.id ?? 0;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfertaEditFormData>({
    resolver: zodResolver(ofertaEditSchema),
    defaultValues: {
      empresa_id: empresaId,
      titulo: practica.titulo ?? '',
      descripcion: practica.descripcion ?? '',
      requisitos: practica.requisitos ?? '',
      fecha_inicio:
        typeof practica.fecha_inicio === 'string'
          ? practica.fecha_inicio.split('T')[0]
          : '',
      fecha_fin:
        typeof practica.fecha_fin === 'string' ? practica.fecha_fin.split('T')[0] : '',
      vacantes: practica.vacantes ?? 1,
      modalidad: (practica.modalidad as OfertaEditFormData['modalidad']) ?? 'presencial',
    },
  });

  const submit = (data: OfertaEditFormData) => {
    onSubmit({
      empresa_id: data.empresa_id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      ...(data.requisitos?.trim() ? { requisitos: data.requisitos.trim() } : {}),
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
      vacantes: data.vacantes,
      modalidad: data.modalidad,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar oferta de práctica</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="empresa_id">ID empresa</Label>
            <Input
              id="empresa_id"
              type="number"
              min={1}
              {...register('empresa_id', { valueAsNumber: true })}
            />
            {errors.empresa_id && (
              <p className="text-sm text-red-600">{errors.empresa_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" {...register('titulo')} placeholder="Título de la oferta" />
              {errors.titulo && (
                <p className="text-sm text-red-600">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                {...register('descripcion')}
                placeholder="Describe las actividades..."
                rows={4}
              />
              {errors.descripcion && (
                <p className="text-sm text-red-600">{errors.descripcion.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="requisitos">Requisitos (opcional)</Label>
              <Textarea
                id="requisitos"
                {...register('requisitos')}
                placeholder="Requisitos para postular..."
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modalidad">Modalidad</Label>
              <Select
                id="modalidad"
                className="w-full"
                value={watch('modalidad')}
                options={[
                  { value: 'presencial', label: 'Presencial' },
                  { value: 'remota', label: 'Remota' },
                  { value: 'hibrida', label: 'Híbrida' },
                ]}
                onChange={(e) =>
                  setValue('modalidad', e.target.value as OfertaEditFormData['modalidad'])
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacantes">Vacantes</Label>
              <Input
                id="vacantes"
                type="number"
                {...register('vacantes', { valueAsNumber: true })}
                min={1}
              />
              {errors.vacantes && (
                <p className="text-sm text-red-600">{errors.vacantes.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
              <Input id="fecha_inicio" type="date" {...register('fecha_inicio')} />
              {errors.fecha_inicio && (
                <p className="text-sm text-red-600">{errors.fecha_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha_fin">Fecha de fin</Label>
              <Input id="fecha_fin" type="date" {...register('fecha_fin')} />
              {errors.fecha_fin && (
                <p className="text-sm text-red-600">{errors.fecha_fin.message}</p>
              )}
            </div>
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

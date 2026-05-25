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

const ESTADOS_TESIS = [
  'propuesta',
  'desarrollo',
  'en_revision',
  'observaciones_emitidas',
  'observaciones_levantadas',
  'aprobado_jurado',
  'expedito',
  'sustentacion_programada',
  'sustentado',
  'culminado',
] as const;

const baseSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  resumen: z.string().optional(),
  fecha_inicio: z.string().optional(),
});

const adminSchema = baseSchema.extend({
  estado: z.string().optional(),
  asesor_principal_id: z.string().optional(),
  estudiante_id: z.string().optional(),
  fecha_recepcion_documentos: z.string().optional(),
  fecha_limite_sustentacion: z.string().optional(),
  fecha_sustentacion: z.string().optional(),
  recibo_turnitin_url: z.string().optional(),
  similitud_turnitin: z.string().optional(),
});

export type TesisEditFormData = z.infer<typeof baseSchema>;
export type TesisAdminFormData = z.infer<typeof adminSchema>;

export type TesisEditSubmitPayload =
  | { mode: 'basic'; data: TesisEditFormData }
  | { mode: 'admin'; data: Record<string, unknown> };

interface AsesorOption {
  id: number;
  label: string;
}

interface TesisEditFormProps {
  tesis: {
    titulo: string;
    resumen?: string | null;
    fecha_inicio?: string | Date | null;
    estado?: string;
    estudiante_id?: number;
    asesor_principal_id?: number;
    fecha_recepcion_documentos?: string | Date | null;
    fecha_limite_sustentacion?: string | Date | null;
    fecha_sustentacion?: string | Date | null;
    recibo_turnitin_url?: string | null;
    similitud_turnitin?: unknown;
  };
  adminMode?: boolean;
  asesores?: AsesorOption[];
  onSubmit: (payload: TesisEditSubmitPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function toDateInputValue(v: string | Date | null | undefined): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.split('T')[0] ?? '';
  return v.toISOString().split('T')[0];
}

function similitudToString(v: unknown): string {
  if (v == null || v === '') return '';
  return String(v);
}

export function TesisEditForm({
  tesis,
  adminMode = false,
  asesores = [],
  onSubmit,
  onCancel,
  isLoading,
}: TesisEditFormProps) {
  const schema = adminMode ? adminSchema : baseSchema;
  const defaultValues = adminMode
    ? {
        titulo: tesis.titulo ?? '',
        resumen: tesis.resumen ?? '',
        fecha_inicio: toDateInputValue(tesis.fecha_inicio),
        estado: tesis.estado ?? '',
        asesor_principal_id:
          tesis.asesor_principal_id != null ? String(tesis.asesor_principal_id) : '',
        estudiante_id:
          tesis.estudiante_id != null ? String(tesis.estudiante_id) : '',
        fecha_recepcion_documentos: toDateInputValue(tesis.fecha_recepcion_documentos),
        fecha_limite_sustentacion: toDateInputValue(tesis.fecha_limite_sustentacion),
        fecha_sustentacion: toDateInputValue(tesis.fecha_sustentacion),
        recibo_turnitin_url: tesis.recibo_turnitin_url ?? '',
        similitud_turnitin: similitudToString(tesis.similitud_turnitin),
      }
    : {
        titulo: tesis.titulo ?? '',
        resumen: tesis.resumen ?? '',
        fecha_inicio: toDateInputValue(tesis.fecha_inicio),
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const submitBasic = (data: z.infer<typeof baseSchema>) => {
    const payload: TesisEditFormData = {
      titulo: data.titulo,
      ...(data.resumen?.trim() ? { resumen: data.resumen.trim() } : { resumen: '' }),
      ...(data.fecha_inicio ? { fecha_inicio: data.fecha_inicio } : {}),
    };
    onSubmit({ mode: 'basic', data: payload });
  };

  const submitAdmin = (data: z.infer<typeof adminSchema>) => {
    const body: Record<string, unknown> = {
      titulo: data.titulo,
    };
    if (data.resumen !== undefined) {
      body.resumen = data.resumen.trim() || '';
    }
    if (data.fecha_inicio) body.fecha_inicio = data.fecha_inicio;
    if (data.estado) body.estado = data.estado;
    if (data.asesor_principal_id) {
      body.asesor_principal_id = parseInt(data.asesor_principal_id, 10);
    }
    if (data.estudiante_id) {
      body.estudiante_id = parseInt(data.estudiante_id, 10);
    }
    if (data.fecha_recepcion_documentos) {
      body.fecha_recepcion_documentos = data.fecha_recepcion_documentos;
    }
    if (data.fecha_limite_sustentacion) {
      body.fecha_limite_sustentacion = data.fecha_limite_sustentacion;
    }
    if (data.fecha_sustentacion) {
      body.fecha_sustentacion = data.fecha_sustentacion;
    }
    if (data.recibo_turnitin_url?.trim()) {
      body.recibo_turnitin_url = data.recibo_turnitin_url.trim();
    }
    const simRaw = data.similitud_turnitin?.trim();
    if (simRaw) {
      const n = parseFloat(simRaw.replace(',', '.'));
      if (!Number.isNaN(n)) body.similitud_turnitin = n;
    }
    onSubmit({ mode: 'admin', data: body });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Tesis</CardTitle>
        <p className="text-sm text-muted-foreground">
          {adminMode
            ? 'Administración: puede ajustar estado, asesor, fechas y datos de Turnitin además del contenido básico.'
            : 'Solo se envían título, resumen y fecha de inicio. El flujo del estado se gestiona en la ficha de la tesis.'}
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(adminMode ? submitAdmin : submitBasic)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" {...register('titulo')} placeholder="Título de la tesis" />
            {errors.titulo && (
              <p className="text-sm text-red-600">{errors.titulo.message as string}</p>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
            <Input id="fecha_inicio" type="date" {...register('fecha_inicio')} />
          </div>

          {adminMode && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado (flujo)</Label>
                  <Select
                    className="w-full"
                    value={watch('estado') as string}
                    options={[
                      { value: '', label: 'Sin cambiar' },
                      ...ESTADOS_TESIS.map((e) => ({ value: e, label: e })),
                    ]}
                    onChange={(e) => setValue('estado', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Asesor principal</Label>
                  <Select
                    className="w-full"
                    value={(watch('asesor_principal_id') as string) || ''}
                    options={[
                      { value: '', label: 'Sin cambiar' },
                      ...asesores.map((a) => ({
                        value: String(a.id),
                        label: a.label,
                      })),
                    ]}
                    onChange={(e) => setValue('asesor_principal_id', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estudiante_id">ID estudiante (cambio avanzado)</Label>
                <Input id="estudiante_id" {...register('estudiante_id')} placeholder="Ej. 12" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Recepción documentos</Label>
                  <Input type="date" {...register('fecha_recepcion_documentos')} />
                </div>
                <div className="space-y-2">
                  <Label>Límite sustentación</Label>
                  <Input type="date" {...register('fecha_limite_sustentacion')} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha sustentación</Label>
                  <Input type="date" {...register('fecha_sustentacion')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recibo_turnitin_url">URL recibo Turnitin</Label>
                  <Input id="recibo_turnitin_url" {...register('recibo_turnitin_url')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="similitud_turnitin">Similitud Turnitin (%)</Label>
                  <Input id="similitud_turnitin" {...register('similitud_turnitin')} />
                </div>
              </div>
            </>
          )}

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

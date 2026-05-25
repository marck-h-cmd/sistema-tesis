'use client';

import React, { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

const ESTADOS_PRACTICA = [
  'plan_pendiente',
  'plan_validado',
  'en_ejecucion',
  'informe_pendiente',
  'aprobado',
] as const;

export type PracticaAdminRow = {
  practicaId: number;
  postulacionId: number;
  horas_totales: number;
  horas_cumplidas: number;
  estado: string;
  fecha_inicio?: string | null;
  fecha_fin_estimada?: string | null;
};

const estudianteSchema = z.object({
  nombres: z.string().min(1, 'Los nombres son requeridos'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  dni: z.string().min(1, 'El DNI es requerido'),
  codigo_universitario: z.string().min(1, 'El código universitario es requerido'),
  escuela_id: z.number().min(1, 'La escuela es requerida'),
  activo: z.boolean().optional(),
});

export type EstudianteFormData = z.infer<typeof estudianteSchema>;

interface EstudianteEditFormProps {
  estudiante: {
    codigo_universitario?: string;
    escuela_id?: number;
    usuario?: {
      nombres?: string;
      apellidos?: string;
      email?: string;
      telefono?: string | null;
      dni?: string;
      activo?: boolean;
    };
  };
  escuelas: { id: number; nombre: string }[];
  onSubmit: (data: EstudianteFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** Admin / coordinador: editar registro Practica (horas, fechas, estado). */
  practicasAdmin?: PracticaAdminRow[];
  onSavePractica?: (
    practicaId: number,
    payload: Record<string, unknown>,
  ) => void | Promise<void>;
  practicaSavingId?: number | null;
}

export function EstudianteEditForm({
  estudiante,
  escuelas,
  onSubmit,
  onCancel,
  isLoading,
  practicasAdmin,
  onSavePractica,
  practicaSavingId,
}: EstudianteEditFormProps) {
  const initialPracticaForms = useMemo(() => {
    const m: Record<
      number,
      {
        horas_totales: string;
        horas_cumplidas: string;
        fecha_inicio: string;
        fecha_fin_estimada: string;
        estado: string;
      }
    > = {};
    for (const row of practicasAdmin ?? []) {
      m[row.practicaId] = {
        horas_totales: String(row.horas_totales ?? ''),
        horas_cumplidas: String(row.horas_cumplidas ?? ''),
        fecha_inicio: row.fecha_inicio
          ? String(row.fecha_inicio).split('T')[0]
          : '',
        fecha_fin_estimada: row.fecha_fin_estimada
          ? String(row.fecha_fin_estimada).split('T')[0]
          : '',
        estado: row.estado ?? 'plan_pendiente',
      };
    }
    return m;
  }, [practicasAdmin]);

  const [practicaFields, setPracticaFields] = useState(initialPracticaForms);

  React.useEffect(() => {
    setPracticaFields(initialPracticaForms);
  }, [initialPracticaForms]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EstudianteFormData>({
    resolver: zodResolver(estudianteSchema),
    defaultValues: {
      nombres: estudiante.usuario?.nombres ?? '',
      apellidos: estudiante.usuario?.apellidos ?? '',
      email: estudiante.usuario?.email ?? '',
      telefono: estudiante.usuario?.telefono ?? '',
      dni: estudiante.usuario?.dni ?? '',
      codigo_universitario: estudiante.codigo_universitario ?? '',
      escuela_id: estudiante.escuela_id ?? 0,
      activo: estudiante.usuario?.activo ?? true,
    },
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Editar Estudiante</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input id="nombres" {...register('nombres')} placeholder="Nombres" />
              {errors.nombres && (
                <p className="text-sm text-red-600">{errors.nombres.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" {...register('apellidos')} placeholder="Apellidos" />
              {errors.apellidos && (
                <p className="text-sm text-red-600">{errors.apellidos.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...register('telefono')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input id="dni" {...register('dni')} />
              {errors.dni && <p className="text-sm text-red-600">{errors.dni.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_universitario">Código universitario</Label>
              <Input id="codigo_universitario" {...register('codigo_universitario')} />
              {errors.codigo_universitario && (
                <p className="text-sm text-red-600">{errors.codigo_universitario.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="escuela_id">Escuela profesional</Label>
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
                onChange={(e) => setValue('escuela_id', parseInt(e.target.value, 10) || 0)}
              />
              {errors.escuela_id && (
                <p className="text-sm text-red-600">{errors.escuela_id.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-8">
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value ?? true}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    Usuario activo
                  </label>
                )}
              />
            </div>
          </div>

          {practicasAdmin && practicasAdmin.length > 0 && onSavePractica && (
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Prácticas del estudiante</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Horas, fechas y estado del expediente (administración).
                </p>
              </div>
              {practicasAdmin.map((row) => {
                const f = practicaFields[row.practicaId] ?? {
                  horas_totales: String(row.horas_totales),
                  horas_cumplidas: String(row.horas_cumplidas),
                  fecha_inicio: row.fecha_inicio
                    ? String(row.fecha_inicio).split('T')[0]
                    : '',
                  fecha_fin_estimada: row.fecha_fin_estimada
                    ? String(row.fecha_fin_estimada).split('T')[0]
                    : '',
                  estado: row.estado,
                };
                return (
                  <div
                    key={row.practicaId}
                    className="rounded-lg border bg-muted/20 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Práctica #{row.practicaId} · Postulación #{row.postulacionId}
                      </span>
                      <Link
                        href={`/practicas/expediente/${row.postulacionId}`}
                        className="text-xs text-primary inline-flex items-center underline"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Expediente
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Horas totales</Label>
                        <Input
                          value={f.horas_totales}
                          onChange={(e) =>
                            setPracticaFields((s) => ({
                              ...s,
                              [row.practicaId]: { ...f, horas_totales: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Horas cumplidas</Label>
                        <Input
                          value={f.horas_cumplidas}
                          onChange={(e) =>
                            setPracticaFields((s) => ({
                              ...s,
                              [row.practicaId]: { ...f, horas_cumplidas: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Inicio</Label>
                        <Input
                          type="date"
                          value={f.fecha_inicio}
                          onChange={(e) =>
                            setPracticaFields((s) => ({
                              ...s,
                              [row.practicaId]: { ...f, fecha_inicio: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fin estimado</Label>
                        <Input
                          type="date"
                          value={f.fecha_fin_estimada}
                          onChange={(e) =>
                            setPracticaFields((s) => ({
                              ...s,
                              [row.practicaId]: {
                                ...f,
                                fecha_fin_estimada: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Estado</Label>
                      <Select
                        className="w-full"
                        value={f.estado}
                        options={ESTADOS_PRACTICA.map((e) => ({
                          value: e,
                          label: e,
                        }))}
                        onChange={(e) =>
                          setPracticaFields((s) => ({
                            ...s,
                            [row.practicaId]: { ...f, estado: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={practicaSavingId === row.practicaId}
                      onClick={() => {
                        const ht = parseInt(f.horas_totales, 10);
                        const hc = parseInt(f.horas_cumplidas, 10);
                        const payload: Record<string, unknown> = {
                          estado: f.estado,
                        };
                        if (!Number.isNaN(ht)) payload.horas_totales = ht;
                        if (!Number.isNaN(hc)) payload.horas_cumplidas = hc;
                        if (f.fecha_inicio) payload.fecha_inicio = f.fecha_inicio;
                        if (f.fecha_fin_estimada) {
                          payload.fecha_fin_estimada = f.fecha_fin_estimada;
                        }
                        void onSavePractica(row.practicaId, payload);
                      }}
                    >
                      {practicaSavingId === row.practicaId
                        ? 'Guardando…'
                        : 'Guardar práctica'}
                    </Button>
                  </div>
                );
              })}
            </div>
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

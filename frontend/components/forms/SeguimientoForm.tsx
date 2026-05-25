'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

/** Solo claves admitidas por UpdateSeguimientoDto (sin horas_cumplidas). */
export interface SeguimientoInformesPayload {
  informe_estudiante?: string;
  informe_asesor?: string;
  evaluacion?: string;
}

interface SeguimientoFormProps {
  /** Payload filtrado para PUT /seguimiento/:id/informes */
  onSubmit: (data: SeguimientoInformesPayload) => Promise<void>;
  initialData?: Partial<
    SeguimientoInformesPayload & { horas_cumplidas?: number }
  >;
  isLoading?: boolean;
  horasTotales?: number;
}

export function SeguimientoForm({
  onSubmit,
  initialData,
  isLoading = false,
  horasTotales = 300,
}: SeguimientoFormProps) {
  const [horas_cumplidas, setHorasCumplidas] = React.useState(
    initialData?.horas_cumplidas ?? 0,
  );
  const [informe_estudiante, setInformeEstudiante] = React.useState(
    initialData?.informe_estudiante ?? '',
  );
  const [informe_asesor, setInformeAsesor] = React.useState(initialData?.informe_asesor ?? '');
  const [evaluacion, setEvaluacion] = React.useState(initialData?.evaluacion ?? 'pendiente');

  const evaluacionOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'desaprobado', label: 'Desaprobado' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SeguimientoInformesPayload = {};
    if (informe_estudiante.trim()) payload.informe_estudiante = informe_estudiante.trim();
    if (informe_asesor.trim()) payload.informe_asesor = informe_asesor.trim();
    if (evaluacion && evaluacion !== 'pendiente') payload.evaluacion = evaluacion;
    await onSubmit(payload);
  };

  const porcentaje = ((horas_cumplidas / horasTotales) * 100).toFixed(1);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="horas_cumplidas">Horas cumplidas (solo referencia)</Label>
        <p className="text-xs text-muted-foreground">
          Para cambiar horas use la acción &quot;Actualizar horas&quot; del backend o la edición
          administrativa de práctica; este formulario no envía horas al endpoint de informes.
        </p>
        <div className="flex items-center space-x-4">
          <Input
            id="horas_cumplidas"
            name="horas_cumplidas"
            type="number"
            min={0}
            max={horasTotales}
            value={horas_cumplidas}
            onChange={(e) => setHorasCumplidas(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">
            de {horasTotales} horas ({porcentaje}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{
              width: `${Math.min((horas_cumplidas / horasTotales) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="informe_estudiante">Informe del estudiante</Label>
        <Textarea
          id="informe_estudiante"
          name="informe_estudiante"
          value={informe_estudiante}
          onChange={(e) => setInformeEstudiante(e.target.value)}
          rows={3}
          placeholder="Informe de avance..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="informe_asesor">Informe del asesor</Label>
        <Textarea
          id="informe_asesor"
          name="informe_asesor"
          value={informe_asesor}
          onChange={(e) => setInformeAsesor(e.target.value)}
          rows={3}
          placeholder="Observaciones del asesor..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evaluacion">Evaluación</Label>
        <Select
          id="evaluacion"
          name="evaluacion"
          options={evaluacionOptions}
          value={evaluacion}
          onChange={(e) => setEvaluacion(e.target.value)}
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
              Guardar informes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

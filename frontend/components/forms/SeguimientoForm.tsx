'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

interface SeguimientoFormData {
  horas_cumplidas: number;
  informe_estudiante: string;
  informe_asesor: string;
  evaluacion: string;
}

interface SeguimientoFormProps {
  onSubmit: (data: SeguimientoFormData) => Promise<void>;
  initialData?: Partial<SeguimientoFormData>;
  isLoading?: boolean;
  horasTotales?: number;
}

export function SeguimientoForm({
  onSubmit,
  initialData,
  isLoading = false,
  horasTotales = 300,
}: SeguimientoFormProps) {
  const [formData, setFormData] = React.useState<SeguimientoFormData>({
    horas_cumplidas: initialData?.horas_cumplidas || 0,
    informe_estudiante: initialData?.informe_estudiante || '',
    informe_asesor: initialData?.informe_asesor || '',
    evaluacion: initialData?.evaluacion || 'pendiente',
  });

  const evaluacionOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobado', label: 'Aprobado' },
    { value: 'desaprobado', label: 'Desaprobado' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'horas_cumplidas' ? Number(value) : value,
    }));
  };

  const porcentaje = ((formData.horas_cumplidas / horasTotales) * 100).toFixed(1);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="horas_cumplidas">Horas cumplidas</Label>
        <div className="flex items-center space-x-4">
          <Input
            id="horas_cumplidas"
            name="horas_cumplidas"
            type="number"
            min={0}
            max={horasTotales}
            value={formData.horas_cumplidas}
            onChange={handleChange}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">
            de {horasTotales} horas ({porcentaje}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min((formData.horas_cumplidas / horasTotales) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="informe_estudiante">Informe del estudiante</Label>
        <Textarea
          id="informe_estudiante"
          name="informe_estudiante"
          value={formData.informe_estudiante}
          onChange={handleChange}
          rows={3}
          placeholder="Escribe el informe de avance..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="informe_asesor">Informe del asesor</Label>
        <Textarea
          id="informe_asesor"
          name="informe_asesor"
          value={formData.informe_asesor}
          onChange={handleChange}
          rows={3}
          placeholder="Escribe las observaciones..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evaluacion">Evaluación</Label>
        <Select
          id="evaluacion"
          name="evaluacion"
          options={evaluacionOptions}
          value={formData.evaluacion}
          onChange={handleChange}
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
              Guardar Seguimiento
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const avanceSchema = z.object({
  tipo: z.string().min(1, 'El tipo es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  fecha_entrega: z.string().min(1, 'La fecha de entrega es requerida'),
  estado: z.enum(['entregado', 'aprobado', 'observado']).optional(),
  observaciones: z.string().optional(),
});

type AvanceFormData = z.infer<typeof avanceSchema>;

interface AvanceEditFormProps {
  initialData?: Partial<AvanceFormData>;
  onSubmit: (data: AvanceFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AvanceEditForm({ initialData, onSubmit, isLoading = false }: AvanceEditFormProps) {
  const [formData, setFormData] = useState<AvanceFormData>({
    tipo: initialData?.tipo || '',
    descripcion: initialData?.descripcion || '',
    fecha_entrega: initialData?.fecha_entrega || '',
    estado: initialData?.estado,
    observaciones: initialData?.observaciones || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validar datos
      const validatedData = avanceSchema.parse(formData);

      // Filtrar campos vacíos para enviar solo los que tienen valor
      const submitData: any = {
        tipo: validatedData.tipo,
        descripcion: validatedData.descripcion,
        fecha_entrega: validatedData.fecha_entrega,
      };

      if (validatedData.estado) {
        submitData.estado = validatedData.estado;
      }

      if (validatedData.observaciones && validatedData.observaciones.trim()) {
        submitData.observaciones = validatedData.observaciones.trim();
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error de validación:', error);
      // Aquí podrías mostrar errores de validación al usuario
    }
  };

  const handleInputChange = (field: keyof AvanceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de avance *</Label>
        <Input
          id="tipo"
          value={formData.tipo}
          onChange={(e) => handleInputChange('tipo', e.target.value)}
          placeholder="Ej: Capítulo 1, propuesta, diseño"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          rows={4}
          placeholder="Describe lo avanzado, resultados y tareas pendientes..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fecha_entrega">Fecha de entrega *</Label>
        <Input
          id="fecha_entrega"
          type="date"
          value={formData.fecha_entrega}
          onChange={(e) => handleInputChange('fecha_entrega', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <Select
          id="estado"
          className="w-full"
          value={formData.estado || ''}
          options={[
            { value: '', label: 'Seleccionar estado (opcional)' },
            { value: 'entregado', label: 'Entregado' },
            { value: 'aprobado', label: 'Aprobado' },
            { value: 'observado', label: 'Observado' },
          ]}
          onChange={(e) => handleInputChange('estado', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => handleInputChange('observaciones', e.target.value)}
          rows={3}
          placeholder="Observaciones adicionales (opcional)"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
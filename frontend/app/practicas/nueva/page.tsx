'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateOferta } from '@/lib/hooks/useOfertas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useFormValidation, validators } from '@/lib/hooks/useFormValidation';
import { FieldWrapper } from '@/components/ui/FieldWrapper';

// ─── Validation rules ─────────────────────────────────────────────────────────

const rules = {
  titulo: [
    validators.required('El título'),
    validators.minLength(5, 'El título'),
    validators.maxLength(150, 'El título'),
  ],
  descripcion: [
    validators.required('La descripción'),
    validators.minLength(20, 'La descripción'),
  ],
  requisitos: [validators.maxLength(500, 'Los requisitos')],
  fecha_inicio: [validators.required('La fecha de inicio')],
  fecha_fin: [
    validators.required('La fecha de fin'),
    validators.dateAfter('fecha_inicio', 'la fecha de inicio', 'La fecha de fin'),
  ],
  vacantes: [validators.required('Las vacantes'), validators.minValue(1, 'Las vacantes')],
  modalidad: [validators.required('La modalidad')],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NuevaOfertaPage() {
  const router = useRouter();
  const createOferta = useCreateOferta();

  const [formData, setFormData] = useState({
    empresa_id: 1,
    titulo: '',
    descripcion: '',
    requisitos: '',
    fecha_inicio: '',
    fecha_fin: '',
    vacantes: 1,
    modalidad: 'presencial',
  });

  const { handleChange, handleBlur, validateAll, getFieldError, isFieldValid } =
    useFormValidation(rules);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const stringValues = () =>
    Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, String(v)]),
    );

  const onFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const parsed = type === 'number' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: parsed }));
    handleChange(name, value, { ...stringValues(), [name]: value });
  };

  const onFieldBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    handleBlur(name, value, stringValues());
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll(stringValues())) return;

    try {
      await createOferta.mutateAsync(formData);
      router.push('/practicas');
    } catch (error) {
      console.error('Error al crear oferta:', error);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/practicas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a prácticas
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Nueva Oferta de Práctica</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} noValidate className="space-y-6">

                <FieldWrapper
                  label="Título de la oferta"
                  required
                  error={getFieldError('titulo')}
                  success={isFieldValid('titulo', formData.titulo)}
                >
                  <Input
                    name="titulo"
                    value={formData.titulo}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    placeholder="Ej: Practicante de Desarrollo Web"
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Descripción"
                  required
                  error={getFieldError('descripcion')}
                  success={isFieldValid('descripcion', formData.descripcion)}
                  hint="Mínimo 20 caracteres"
                >
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    placeholder="Describe las actividades y responsabilidades..."
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Requisitos"
                  error={getFieldError('requisitos')}
                  success={isFieldValid('requisitos', formData.requisitos)}
                >
                  <textarea
                    name="requisitos"
                    value={formData.requisitos}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    placeholder="Conocimientos y habilidades requeridas..."
                  />
                </FieldWrapper>

                <div className="grid grid-cols-2 gap-4">
                  <FieldWrapper
                    label="Fecha de inicio"
                    required
                    error={getFieldError('fecha_inicio')}
                    success={isFieldValid('fecha_inicio', formData.fecha_inicio)}
                  >
                    <Input
                      type="date"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={onFieldChange}
                      onBlur={onFieldBlur}
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    label="Fecha de fin"
                    required
                    error={getFieldError('fecha_fin')}
                    success={isFieldValid('fecha_fin', formData.fecha_fin)}
                  >
                    <Input
                      type="date"
                      name="fecha_fin"
                      value={formData.fecha_fin}
                      onChange={onFieldChange}
                      onBlur={onFieldBlur}
                    />
                  </FieldWrapper>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FieldWrapper
                    label="Vacantes"
                    required
                    error={getFieldError('vacantes')}
                    success={isFieldValid('vacantes', String(formData.vacantes))}
                  >
                    <Input
                      type="number"
                      name="vacantes"
                      value={formData.vacantes}
                      onChange={onFieldChange}
                      onBlur={onFieldBlur}
                      min={1}
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    label="Modalidad"
                    required
                    error={getFieldError('modalidad')}
                    success={isFieldValid('modalidad', formData.modalidad)}
                  >
                    <select
                      name="modalidad"
                      value={formData.modalidad}
                      onChange={onFieldChange}
                      onBlur={onFieldBlur}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                    >
                      <option value="presencial">Presencial</option>
                      <option value="remota">Remota</option>
                      <option value="hibrida">Híbrida</option>
                    </select>
                  </FieldWrapper>
                </div>

                <div className="flex justify-end space-x-4">
                  <Link href="/practicas">
                    <Button type="button" variant="outline">Cancelar</Button>
                  </Link>
                  <Button type="submit" disabled={createOferta.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {createOferta.isPending ? 'Guardando...' : 'Guardar Oferta'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
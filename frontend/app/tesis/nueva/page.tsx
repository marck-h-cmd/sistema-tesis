'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tesisApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Search, User, Check, ChevronDown, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useFormValidation, validators } from '@/lib/hooks/useFormValidation';
import { FieldWrapper } from '@/components/ui/FieldWrapper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EstudianteData {
  id: number;
  usuario_id: number;
  codigo_universitario: string;
  escuela_id: number;
  usuario: { id: number; nombres: string; apellidos: string; email: string; dni: string };
  escuela: { id: number; nombre: string; facultad: string };
}

interface AsesorOption {
  id: number;
  usuario: { nombres: string; apellidos: string; email: string };
  especialidad: string;
  escuela: { nombre: string; facultad: string };
}

// ─── Validation rules ─────────────────────────────────────────────────────────

const rules = {
  titulo: [
    validators.required('El título'),
    validators.minLength(10, 'El título'),
    validators.maxLength(300, 'El título'),
  ],
  resumen: [validators.maxLength(1000, 'El resumen')],
  fecha_inicio: [],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NuevaTesisPage() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    resumen: '',
    estudiante_id: 0,
    asesor_principal_id: 0,
    fecha_inicio: '',
  });

  // ComboBox states
  const [asesorSearch, setAsesorSearch] = useState('');
  const [asesorOpen, setAsesorOpen] = useState(false);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState<AsesorOption | null>(null);
  const [asesorTouched, setAsesorTouched] = useState(false);

  const [estudianteSearch, setEstudianteSearch] = useState('');
  const [estudianteOpen, setEstudianteOpen] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteData | null>(null);
  const [estudianteTouched, setEstudianteTouched] = useState(false);

  const { handleChange, handleBlur, validateAll, getFieldError, isFieldValid } =
    useFormValidation(rules);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: miEstudiante, isLoading: loadingMiEstudiante } = useQuery({
    queryKey: ['mi-estudiante', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/estudiantes');
      const lista = res.data.data as EstudianteData[];
      return lista.find((e) => e.usuario_id === user?.id || e.usuario?.email === user?.email) ?? null;
    },
    enabled: !!user && hasRole('estudiante'),
  });

  const { data: estudiantes, isLoading: loadingEstudiantes } = useQuery({
    queryKey: ['estudiantes-list'],
    queryFn: async () => {
      const res = await apiClient.get('/estudiantes');
      return res.data.data as EstudianteData[];
    },
    enabled: !hasRole('estudiante'),
  });

  const { data: asesores, isLoading: loadingAsesores } = useQuery({
    queryKey: ['asesores-list'],
    queryFn: async () => {
      const res = await apiClient.get('/asesores');
      return res.data.data as AsesorOption[];
    },
    enabled: asesorOpen,
  });

  useEffect(() => {
    if (miEstudiante && hasRole('estudiante')) {
      setEstudianteSeleccionado(miEstudiante);
      setFormData((prev) => ({ ...prev, estudiante_id: miEstudiante.id }));
    }
  }, [miEstudiante, hasRole]);

  // ── Filtered lists ─────────────────────────────────────────────────────────

  const filteredEstudiantes = estudiantes?.filter((e) => {
    const s = estudianteSearch.toLowerCase();
    return (
      !estudianteSearch ||
      e.usuario.nombres.toLowerCase().includes(s) ||
      e.usuario.apellidos.toLowerCase().includes(s) ||
      e.codigo_universitario.toLowerCase().includes(s) ||
      e.usuario.dni.includes(s)
    );
  });

  const filteredAsesores = asesores?.filter((a) => {
    const s = asesorSearch.toLowerCase();
    return (
      !asesorSearch ||
      a.usuario.nombres.toLowerCase().includes(s) ||
      a.usuario.apellidos.toLowerCase().includes(s) ||
      a.especialidad?.toLowerCase().includes(s) ||
      a.escuela.nombre.toLowerCase().includes(s)
    );
  });

  // ── Derived error states for combo fields ──────────────────────────────────

  const asesorError =
    asesorTouched && !asesorSeleccionado ? 'Debe seleccionar un asesor' : null;
  const estudianteError =
    estudianteTouched && !hasRole('estudiante') && !estudianteSeleccionado
      ? 'Debe seleccionar un estudiante'
      : null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const stringValues = () => ({
    titulo: formData.titulo,
    resumen: formData.resumen,
    fecha_inicio: formData.fecha_inicio,
  });

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    handleChange(name, value, { ...stringValues(), [name]: value });
  };

  const onFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleBlur(name, value, stringValues());
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger combo validations
    setAsesorTouched(true);
    setEstudianteTouched(true);

    const textValid = validateAll(stringValues());
    const asesorValid = !!asesorSeleccionado;
    const estudianteValid = hasRole('estudiante') ? !!miEstudiante : !!estudianteSeleccionado;

    if (!textValid || !asesorValid || !estudianteValid) return;

    setIsSubmitting(true);
    try {
      await tesisApi.create({
        titulo: formData.titulo,
        resumen: formData.resumen || undefined,
        estudiante_id: formData.estudiante_id,
        asesor_principal_id: asesorSeleccionado!.id,
        fecha_inicio: formData.fecha_inicio || undefined,
      });
      toast.success('Tesis registrada exitosamente');
      router.push('/tesis');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar tesis');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <Link
          href="/tesis"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a tesis
        </Link>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Registrar Nueva Tesis</CardTitle>
              <CardDescription>Complete los datos del proyecto de tesis</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} noValidate className="space-y-8">

                {/* Título */}
                <FieldWrapper
                  label="Título de la tesis"
                  required
                  error={getFieldError('titulo')}
                  success={isFieldValid('titulo', formData.titulo)}
                  hint="Mínimo 10 caracteres"
                >
                  <Input
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    placeholder="Ej: Sistema de Gestión de Prácticas Preprofesionales"
                    className="text-lg"
                  />
                </FieldWrapper>

                {/* Resumen */}
                <FieldWrapper
                  label="Resumen"
                  error={getFieldError('resumen')}
                  success={isFieldValid('resumen', formData.resumen)}
                >
                  <Textarea
                    id="resumen"
                    name="resumen"
                    value={formData.resumen}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    rows={4}
                    placeholder="Breve descripción del proyecto de tesis..."
                  />
                </FieldWrapper>

                {/* Estudiante */}
                <div className="space-y-1.5">
                  <Label>
                    Estudiante <span className="text-red-500">*</span>
                  </Label>

                  {hasRole('estudiante') ? (
                    loadingMiEstudiante ? (
                      <div className="flex items-center p-4 border rounded-lg bg-gray-50">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3" />
                        <p className="text-sm text-muted-foreground">Cargando tu información...</p>
                      </div>
                    ) : miEstudiante ? (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {miEstudiante.usuario.nombres} {miEstudiante.usuario.apellidos}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {miEstudiante.codigo_universitario} • {miEstudiante.escuela.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {miEstudiante.escuela.facultad}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Tú</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                        <p className="text-sm text-red-700">
                          No se encontró tu información de estudiante. Contacta al administrador.
                        </p>
                      </div>
                    )
                  ) : (
                    // Admin/coordinador combobox
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          value={
                            estudianteSeleccionado
                              ? `${estudianteSeleccionado.usuario.nombres} ${estudianteSeleccionado.usuario.apellidos} - ${estudianteSeleccionado.codigo_universitario}`
                              : estudianteSearch
                          }
                          onChange={(e) => {
                            setEstudianteSearch(e.target.value);
                            setEstudianteSeleccionado(null);
                            setFormData((prev) => ({ ...prev, estudiante_id: 0 }));
                            setEstudianteOpen(true);
                          }}
                          onFocus={() => setEstudianteOpen(true)}
                          onBlur={() => {
                            setTimeout(() => setEstudianteOpen(false), 150);
                            setEstudianteTouched(true);
                          }}
                          placeholder="Buscar por nombre, código o DNI..."
                          className={cn(
                            'w-full h-10 pl-10 pr-10 rounded-md border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
                            estudianteError ? 'border-red-400 focus-visible:ring-red-400' : 'border-input',
                            estudianteTouched && estudianteSeleccionado && 'border-green-400',
                          )}
                        />
                        {estudianteSeleccionado ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEstudianteSeleccionado(null);
                              setEstudianteSearch('');
                              setFormData((prev) => ({ ...prev, estudiante_id: 0 }));
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <ChevronDown
                            className={cn(
                              'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform',
                              estudianteOpen && 'rotate-180',
                            )}
                          />
                        )}
                      </div>

                      {estudianteError && (
                        <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5 animate-in slide-in-from-top-1 duration-150">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {estudianteError}
                        </p>
                      )}

                      {estudianteOpen && !estudianteSeleccionado && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {loadingEstudiantes ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                            </div>
                          ) : filteredEstudiantes?.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                              {estudianteSearch ? 'No se encontraron estudiantes' : 'Escribe para buscar'}
                            </p>
                          ) : (
                            filteredEstudiantes?.map((est) => (
                              <button
                                key={est.id}
                                type="button"
                                onMouseDown={() => {
                                  setEstudianteSeleccionado(est);
                                  setEstudianteSearch('');
                                  setEstudianteOpen(false);
                                  setFormData((prev) => ({ ...prev, estudiante_id: est.id }));
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {est.usuario.nombres} {est.usuario.apellidos}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {est.codigo_universitario} • {est.escuela.nombre}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Asesor combobox */}
                <div className="space-y-1.5">
                  <Label>
                    Asesor Principal <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        value={
                          asesorSeleccionado
                            ? `${asesorSeleccionado.usuario.nombres} ${asesorSeleccionado.usuario.apellidos} - ${asesorSeleccionado.especialidad || 'Sin especialidad'}`
                            : asesorSearch
                        }
                        onChange={(e) => {
                          setAsesorSearch(e.target.value);
                          setAsesorSeleccionado(null);
                          setFormData((prev) => ({ ...prev, asesor_principal_id: 0 }));
                          setAsesorOpen(true);
                        }}
                        onFocus={() => setAsesorOpen(true)}
                        onBlur={() => {
                          setTimeout(() => setAsesorOpen(false), 150);
                          setAsesorTouched(true);
                        }}
                        placeholder="Buscar asesor por nombre, especialidad o escuela..."
                        className={cn(
                          'w-full h-10 pl-10 pr-10 rounded-md border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
                          asesorError ? 'border-red-400 focus-visible:ring-red-400' : 'border-input',
                          asesorTouched && asesorSeleccionado && 'border-green-400',
                        )}
                      />
                      {asesorSeleccionado ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAsesorSeleccionado(null);
                            setAsesorSearch('');
                            setFormData((prev) => ({ ...prev, asesor_principal_id: 0 }));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <ChevronDown
                          className={cn(
                            'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform',
                            asesorOpen && 'rotate-180',
                          )}
                        />
                      )}
                    </div>

                    {asesorError && (
                      <p className="flex items-center gap-1 text-xs text-red-600 mt-1.5 animate-in slide-in-from-top-1 duration-150">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {asesorError}
                      </p>
                    )}

                    {asesorOpen && !asesorSeleccionado && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingAsesores ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                          </div>
                        ) : filteredAsesores?.length === 0 ? (
                          <p className="p-4 text-center text-sm text-muted-foreground">
                            {asesorSearch ? 'No se encontraron asesores' : 'Escribe para buscar'}
                          </p>
                        ) : (
                          filteredAsesores?.map((asesor) => (
                            <button
                              key={asesor.id}
                              type="button"
                              onMouseDown={() => {
                                setAsesorSeleccionado(asesor);
                                setAsesorSearch('');
                                setAsesorOpen(false);
                                setFormData((prev) => ({ ...prev, asesor_principal_id: asesor.id }));
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {asesor.usuario.nombres} {asesor.usuario.apellidos}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {asesor.especialidad || 'Sin especialidad'} • {asesor.escuela.nombre}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fecha de inicio */}
                <FieldWrapper label="Fecha de inicio" error={getFieldError('fecha_inicio')}>
                  <Input
                    id="fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                  />
                </FieldWrapper>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Link href="/tesis">
                    <Button type="button" variant="outline">Cancelar</Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Registrar Tesis
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
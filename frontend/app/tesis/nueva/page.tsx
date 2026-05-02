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
import { ArrowLeft, Save, Search, User, Check, ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface EstudianteData {
  id: number;
  usuario_id: number;
  codigo_universitario: string;
  escuela_id: number;
  ciclo: string;
  usuario: {
    id: number;
    nombres: string;
    apellidos: string;
    email: string;
    dni: string;
  };
  escuela: {
    id: number;
    nombre: string;
    facultad: string;
  };
}

interface AsesorOption {
  id: number;
  usuario: {
    nombres: string;
    apellidos: string;
    email: string;
  };
  especialidad: string;
  escuela: {
    nombre: string;
    facultad: string;
  };
}

export default function NuevaTesisPage() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    resumen: '',
    estudiante_id: 0,
    asesor_principal_id: 0,
    fecha_inicio: '',
  });

  // Estados para el ComboBox de Asesor
  const [asesorSearch, setAsesorSearch] = useState('');
  const [asesorOpen, setAsesorOpen] = useState(false);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState<AsesorOption | null>(null);

  // Estados para el ComboBox de Estudiante (solo admin/coordinador)
  const [estudianteSearch, setEstudianteSearch] = useState('');
  const [estudianteOpen, setEstudianteOpen] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteData | null>(null);

  // Cargar el estudiante automáticamente si el usuario es estudiante
  const { data: miEstudiante, isLoading: loadingMiEstudiante } = useQuery({
    
    queryKey: ['mi-estudiante', user?.id],
    queryFn: async () => {
      // Primero obtenemos el estudiante por el usuario_id
      // Como no tenemos el ID del estudiante, buscamos en la lista
      const res = await apiClient.get('/estudiantes');
      const estudiantes = res.data.data as EstudianteData[];
      const miEstudiante = estudiantes.find(
        (e) => e.usuario_id === user?.id || e.usuario?.email === user?.email
      );
      return miEstudiante || null;
    },
    enabled: !!user && hasRole('estudiante'),
  });

  // Cargar lista de estudiantes (solo para admin/coordinador)
  const { data: estudiantes, isLoading: loadingEstudiantes } = useQuery({
    queryKey: ['estudiantes-list'],
    queryFn: async () => {
      const res = await apiClient.get('/estudiantes');
      return res.data.data as EstudianteData[];
    },
    enabled: !hasRole('estudiante'), // Solo cargar si NO es estudiante
  });

  // Cargar lista de asesores
  const { data: asesores, isLoading: loadingAsesores } = useQuery({
    queryKey: ['asesores-list'],
    queryFn: async () => {
      const res = await apiClient.get('/asesores');
      return res.data.data as AsesorOption[];
    },
    enabled: asesorOpen, // Solo cargar cuando el dropdown está abierto
  });

  // Auto-seleccionar estudiante cuando se carga
  useEffect(() => {
    if (miEstudiante && hasRole('estudiante')) {
      setEstudianteSeleccionado(miEstudiante);
      setFormData(prev => ({ ...prev, estudiante_id: miEstudiante.id }));
    }
  }, [miEstudiante, hasRole]);

  // Filtrar estudiantes (para admin/coordinador)
  const filteredEstudiantes = estudiantes?.filter((e: EstudianteData) => {
    const search = estudianteSearch.toLowerCase();
    return (
      !estudianteSearch ||
      e.usuario.nombres.toLowerCase().includes(search) ||
      e.usuario.apellidos.toLowerCase().includes(search) ||
      e.codigo_universitario.toLowerCase().includes(search) ||
      e.usuario.dni.includes(search)
    );
  });

  // Filtrar asesores
  const filteredAsesores = asesores?.filter((a: AsesorOption) => {
    const search = asesorSearch.toLowerCase();
    return (
      !asesorSearch ||
      a.usuario.nombres.toLowerCase().includes(search) ||
      a.usuario.apellidos.toLowerCase().includes(search) ||
      a.especialidad?.toLowerCase().includes(search) ||
      a.escuela.nombre.toLowerCase().includes(search)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.estudiante_id) {
      toast.error('No se pudo identificar al estudiante');
      return;
    }

    if (!asesorSeleccionado) {
      toast.error('Debe seleccionar un asesor');
      return;
    }

    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }

    setIsSubmitting(true);

    try {
      await tesisApi.create({
        titulo: formData.titulo,
        resumen: formData.resumen || undefined,
        estudiante_id: formData.estudiante_id,
        asesor_principal_id: asesorSeleccionado.id,
        fecha_inicio: formData.fecha_inicio || undefined,
      });
      toast.success('Tesis registrada exitosamente');
      router.push('/tesis');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar tesis';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
              <CardDescription>
                Complete los datos del proyecto de tesis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="titulo">
                    Título de la tesis <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    placeholder="Ej: Sistema de Gestión de Prácticas Preprofesionales"
                    className="text-lg"
                    required
                  />
                </div>

                {/* Resumen */}
                <div className="space-y-2">
                  <Label htmlFor="resumen">Resumen (opcional)</Label>
                  <Textarea
                    id="resumen"
                    name="resumen"
                    value={formData.resumen}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Breve descripción del proyecto de tesis..."
                  />
                </div>

                {/* Sección Estudiante */}
                <div className="space-y-2">
                  <Label>
                    Estudiante <span className="text-red-500">*</span>
                  </Label>

                  {hasRole('estudiante') ? (
                    // === MODO ESTUDIANTE: Auto-seleccionado, solo lectura ===
                    loadingMiEstudiante ? (
                      <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
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
                              {miEstudiante.escuela.facultad} • {miEstudiante.ciclo} ciclo
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
                    // === MODO ADMIN/COORDINADOR: ComboBox con búsqueda ===
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                            setFormData(prev => ({ ...prev, estudiante_id: 0 }));
                            setEstudianteOpen(true);
                          }}
                          onFocus={() => setEstudianteOpen(true)}
                          placeholder="Buscar estudiante por nombre, código o DNI..."
                          className="w-full h-10 pl-10 pr-10 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        {estudianteSeleccionado && (
                          <button
                            type="button"
                            onClick={() => {
                              setEstudianteSeleccionado(null);
                              setEstudianteSearch('');
                              setFormData(prev => ({ ...prev, estudiante_id: 0 }));
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {!estudianteSeleccionado && (
                          <ChevronDown
                            className={cn(
                              "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform",
                              estudianteOpen && "rotate-180"
                            )}
                          />
                        )}
                      </div>

                      {/* Dropdown de estudiantes */}
                      {estudianteOpen && !estudianteSeleccionado && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {loadingEstudiantes ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                              <p className="text-sm text-muted-foreground mt-2">Cargando estudiantes...</p>
                            </div>
                          ) : filteredEstudiantes?.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {estudianteSearch ? 'No se encontraron estudiantes' : 'Escribe para buscar estudiantes'}
                            </div>
                          ) : (
                            filteredEstudiantes?.map((estudiante) => (
                              <button
                                key={estudiante.id}
                                type="button"
                                onClick={() => {
                                  setEstudianteSeleccionado(estudiante);
                                  setEstudianteSearch('');
                                  setEstudianteOpen(false);
                                  setFormData(prev => ({ ...prev, estudiante_id: estudiante.id }));
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {estudiante.usuario.nombres} {estudiante.usuario.apellidos}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {estudiante.codigo_universitario} • {estudiante.escuela.nombre} • {estudiante.ciclo} ciclo
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      DNI: {estudiante.usuario.dni}
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

                {/* ComboBox Asesor (para todos los roles) */}
                <div className="space-y-2">
                  <Label>
                    Asesor Principal <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                          setFormData(prev => ({ ...prev, asesor_principal_id: 0 }));
                          setAsesorOpen(true);
                        }}
                        onFocus={() => setAsesorOpen(true)}
                        placeholder="Buscar asesor por nombre, especialidad o escuela..."
                        className="w-full h-10 pl-10 pr-10 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {asesorSeleccionado && (
                        <button
                          type="button"
                          onClick={() => {
                            setAsesorSeleccionado(null);
                            setAsesorSearch('');
                            setFormData(prev => ({ ...prev, asesor_principal_id: 0 }));
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      {!asesorSeleccionado && (
                        <ChevronDown
                          className={cn(
                            "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-transform",
                            asesorOpen && "rotate-180"
                          )}
                        />
                      )}
                    </div>

                    {/* Dropdown de asesores */}
                    {asesorOpen && !asesorSeleccionado && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingAsesores ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                            <p className="text-sm text-muted-foreground mt-2">Cargando asesores...</p>
                          </div>
                        ) : filteredAsesores?.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {asesorSearch ? 'No se encontraron asesores' : 'Escribe para buscar asesores'}
                          </div>
                        ) : (
                          filteredAsesores?.map((asesor) => (
                            <button
                              key={asesor.id}
                              type="button"
                              onClick={() => {
                                setAsesorSeleccionado(asesor);
                                setAsesorSearch('');
                                setAsesorOpen(false);
                                setFormData(prev => ({ ...prev, asesor_principal_id: asesor.id }));
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {asesor.usuario.nombres} {asesor.usuario.apellidos}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {asesor.especialidad || 'Sin especialidad'} • {asesor.escuela.nombre}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {asesor.escuela.facultad}
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
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
                  <Input
                    id="fecha_inicio"
                    name="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Link href="/tesis">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
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
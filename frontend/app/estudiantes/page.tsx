'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { estudiantesApi, practicasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, User, Mail, Phone, School, Edit } from 'lucide-react';
import { EstudianteEditForm, type PracticaAdminRow } from '@/components/forms/EstudianteEditForm';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function EstudiantesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEstudiante, setEditingEstudiante] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [practicaSavingId, setPracticaSavingId] = useState<number | null>(null);
  const { hasRole } = useAuth();
  const qc = useQueryClient();

  const canAdminPractica = hasRole('admin') || hasRole('coordinador');

  const { data: estudiantes, isLoading, refetch } = useQuery({
    queryKey: ['estudiantes'],
    queryFn: () => estudiantesApi.getAll().then(res => res.data.data),
  });

  // Obtener escuelas para el formulario de edición
  const { data: escuelas } = useQuery({
    queryKey: ['escuelas'],
    queryFn: async () => {
      // Asumiendo que hay un endpoint para obtener escuelas
      // Si no existe, necesitaríamos crearlo o hardcodear las escuelas
      return [
        { id: 1, nombre: 'Ingeniería de Sistemas' },
        { id: 2, nombre: 'Ingeniería Civil' },
        { id: 3, nombre: 'Ingeniería Industrial' },
        { id: 4, nombre: 'Ingeniería Mecánica' },
        { id: 5, nombre: 'Ingeniería Electrónica' },
      ];
    },
  });

  const { data: estudianteEditDetail } = useQuery({
    queryKey: ['estudiante', editingEstudiante?.id, 'modal-detail'],
    queryFn: () =>
      estudiantesApi.getOne(editingEstudiante!.id).then((res) => res.data.data),
    enabled: !!editingEstudiante,
  });

  const practicasAdminRows: PracticaAdminRow[] = !canAdminPractica
    ? []
    : estudianteEditDetail?.postulaciones
        ?.filter((p: { practica?: unknown }) => p.practica)
        .map((p: any) => ({
          practicaId: p.practica.id,
          postulacionId: p.id,
          horas_totales: p.practica.horas_totales ?? 0,
          horas_cumplidas: p.practica.horas_cumplidas ?? 0,
          estado: p.practica.estado,
          fecha_inicio: p.practica.fecha_inicio,
          fecha_fin_estimada: p.practica.fecha_fin_estimada,
        })) ?? [];

  const handleSavePractica = async (
    practicaId: number,
    payload: Record<string, unknown>,
  ) => {
    setPracticaSavingId(practicaId);
    try {
      await practicasApi.updateAdmin(practicaId, payload);
      toast.success('Práctica actualizada');
      await qc.invalidateQueries({
        queryKey: ['estudiante', editingEstudiante?.id, 'modal-detail'],
      });
      await refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'No se pudo actualizar la práctica');
    } finally {
      setPracticaSavingId(null);
    }
  };

  const handleEditEstudiante = async (data: {
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    dni: string;
    codigo_universitario: string;
    escuela_id: number;
    activo?: boolean;
  }) => {
    if (!editingEstudiante) return;

    setIsEditing(true);
    try {
      await estudiantesApi.update(editingEstudiante.id, {
        codigo_universitario: data.codigo_universitario,
        escuela_id: data.escuela_id,
        usuario: {
          nombres: data.nombres,
          apellidos: data.apellidos,
          email: data.email,
          telefono: data.telefono || undefined,
          dni: data.dni,
          activo: data.activo,
        },
      });
      toast.success('Estudiante actualizado exitosamente');
      setEditingEstudiante(null);
      refetch();
      qc.invalidateQueries({
        queryKey: ['estudiante', editingEstudiante.id, 'modal-detail'],
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar el estudiante');
    } finally {
      setIsEditing(false);
    }
  };

  const openEditModal = (estudiante: any) => {
    setEditingEstudiante(estudiante);
  };

  const closeEditModal = () => {
    setEditingEstudiante(null);
  };

  const filteredEstudiantes = estudiantes?.filter((est: any) =>
    `${est.usuario.nombres} ${est.usuario.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.codigo_universitario.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50">

        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Estudiantes</h1>
            <p className="text-muted-foreground mt-1">
              Listado de estudiantes registrados
            </p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEstudiantes?.map((estudiante: any) => (
              <Card key={estudiante.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {estudiante.usuario.nombres} {estudiante.usuario.apellidos}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Código: {estudiante.codigo_universitario}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <School className="h-4 w-4 mr-2" />
                      {estudiante.escuela.nombre}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2" />
                      {estudiante.usuario.email}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                    {estudiante._count && (
                      <>
                        <span>Prácticas: {estudiante._count.postulaciones}</span>
                        <span>Tesis: {estudiante._count.tesis}</span>
                      </>
                    )}
                  </div>

                  {/* Botón de editar para admins */}
                  {(hasRole('admin') || hasRole('coordinador') || hasRole('secretaria')) && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(estudiante)}
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
    
      {/* Modal de edición */}
      <Dialog
        open={!!editingEstudiante}
        onClose={closeEditModal}
        title="Editar Estudiante"
      >
        {editingEstudiante && escuelas && (
          <EstudianteEditForm
            estudiante={estudianteEditDetail ?? editingEstudiante}
            escuelas={escuelas}
            onSubmit={handleEditEstudiante}
            onCancel={closeEditModal}
            isLoading={isEditing}
            practicasAdmin={canAdminPractica ? practicasAdminRows : undefined}
            onSavePractica={canAdminPractica ? handleSavePractica : undefined}
            practicaSavingId={practicaSavingId ?? undefined}
          />
        )}
      </Dialog>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estudiantesApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, User, Mail, Phone, School, Edit } from 'lucide-react';
import { EstudianteEditForm } from '@/components/forms/EstudianteEditForm';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function EstudiantesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEstudiante, setEditingEstudiante] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { hasRole } = useAuth();

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

  const handleEditEstudiante = async (data: any) => {
    if (!editingEstudiante) return;

    setIsEditing(true);
    try {
      await estudiantesApi.update(editingEstudiante.id, data);
      toast.success('Estudiante actualizado exitosamente');
      setEditingEstudiante(null);
      refetch();
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
                    {estudiante.ciclo && (
                      <Badge variant="secondary" className="mt-2">
                        {estudiante.ciclo} ciclo
                      </Badge>
                    )}
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
                  {(hasRole('admin') || hasRole('coordinador')) && (
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
            estudiante={editingEstudiante}
            escuelas={escuelas}
            onSubmit={handleEditEstudiante}
            onCancel={closeEditModal}
            isLoading={isEditing}
          />
        )}
      </Dialog>
    </div>
  );
}
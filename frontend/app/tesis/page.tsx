'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { tesisApi, estudiantesApi, asesoresApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  GraduationCap,
  User,
  Calendar,
  FileText,
  Eye,
  Edit
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { TesisEditForm, type TesisEditSubmitPayload } from '@/components/forms/TesisEditForm';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';

const estadosTesis: Record<string, { color: string; label: string }> = {
  propuesta: { color: 'bg-blue-100 text-blue-800', label: 'Propuesta' },
  desarrollo: { color: 'bg-yellow-100 text-yellow-800', label: 'En desarrollo' },
  en_revision: { color: 'bg-amber-100 text-amber-900', label: 'En revisión (jurado)' },
  observaciones_emitidas: { color: 'bg-orange-100 text-orange-900', label: 'Observaciones jurado' },
  observaciones_levantadas: { color: 'bg-cyan-100 text-cyan-900', label: 'Correcciones cargadas' },
  aprobado_jurado: { color: 'bg-indigo-100 text-indigo-900', label: 'Aprobado por jurado' },
  expedito: { color: 'bg-emerald-100 text-emerald-900', label: 'Expedito' },
  sustentacion_programada: { color: 'bg-purple-100 text-purple-900', label: 'Sustentación programada' },
  sustentado: { color: 'bg-violet-100 text-violet-900', label: 'Sustentado' },
  culminado: { color: 'bg-green-100 text-green-800', label: 'Culminado' },
};

export default function TesisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTesis, setEditingTesis] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { hasRole, user } = useAuth();
  const adminEdit = hasRole('admin') || hasRole('coordinador');

  // Query para obtener el estudiante si el usuario es estudiante
  const { data: estudiante, isLoading: isLoadingEstudiante } = useQuery({
    queryKey: ['estudiante', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await estudiantesApi.getByUserId(user.id);
      return response.data.data;
    },
    enabled: hasRole('estudiante') && !!user?.id,
  });

  // Query para obtener las tesis según el rol
  const { data: tesis, isLoading: isLoadingTesis, error, refetch } = useQuery({
    queryKey: ['tesis', hasRole('estudiante') ? `estudiante_${estudiante?.id}` : 'all'],
    queryFn: async () => {
      if (hasRole('estudiante')) {
        // Si es estudiante, obtener solo sus tesis
        if (!estudiante?.id) {
          return [];
        }
        const response = await tesisApi.getByEstudiante(estudiante.id);
        return response.data.data;
      } else {
        // Si es admin, coordinador o asesor, obtener todas las tesis
        const response = await tesisApi.getAll();
        return response.data.data;
      }
    },
    enabled: !hasRole('estudiante') || (hasRole('estudiante') && !!estudiante?.id),
  });

  const { data: asesoresList } = useQuery({
    queryKey: ['asesores', 'tesis-edit'],
    queryFn: () => asesoresApi.getAll().then((res) => res.data.data),
    enabled: adminEdit,
  });

  const asesorOptions =
    asesoresList?.map((a: any) => ({
      id: a.id,
      label: `${a.usuario?.nombres ?? ''} ${a.usuario?.apellidos ?? ''}`.trim() || `Asesor #${a.id}`,
    })) ?? [];

  const handleEditTesis = async (payload: TesisEditSubmitPayload) => {
    if (!editingTesis) return;

    setIsEditing(true);
    try {
      if (payload.mode === 'admin') {
        await tesisApi.updateAdmin(editingTesis.id, payload.data);
      } else {
        const data = payload.data;
        const body: Record<string, unknown> = { titulo: data.titulo };
        if (data.resumen !== undefined) body.resumen = data.resumen || null;
        if (data.fecha_inicio) body.fecha_inicio = data.fecha_inicio;
        await tesisApi.update(editingTesis.id, body);
      }
      toast.success('Tesis actualizada exitosamente');
      setEditingTesis(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar la tesis');
    } finally {
      setIsEditing(false);
    }
  };

  const openEditModal = (tesis: any) => {
    setEditingTesis(tesis);
  };

  const closeEditModal = () => {
    setEditingTesis(null);
  };

  const isLoading = isLoadingEstudiante || isLoadingTesis;

  // Filtrar tesis por término de búsqueda
  const filteredTesis = tesis?.filter((t: any) =>
    t.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.estudiante?.usuario?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.estudiante?.usuario?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateTesis = hasRole('admin') || hasRole('coordinador') || hasRole('estudiante');

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tesis</h1>
            <p className="text-muted-foreground mt-1">
              {hasRole('estudiante') 
                ? `Mis proyectos de tesis${estudiante ? ` - ${estudiante.codigo_universitario}` : ''}` 
                : 'Gestión de proyectos de tesis'}
            </p>
          </div>
          {canCreateTesis && (
            <Link href="/tesis/nueva">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tesis
              </Button>
            </Link>
          )}
        </div>

        {/* Error handling */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error al cargar las tesis. Por favor, intenta de nuevo más tarde.
          </div>
        )}

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Buscar tesis por título o estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Tesis grid */}
            {filteredTesis && filteredTesis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTesis.map((t: any) => {
                  const estadoConfig = estadosTesis[t.estado] || { 
                    color: 'bg-gray-100 text-gray-800', 
                    label: t.estado 
                  };
                  
                  return (
                    <Card key={t.id} className="hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                              {t.titulo}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <User className="h-4 w-4 mr-1" />
                              {t.estudiante?.usuario?.nombres} {t.estudiante?.usuario?.apellidos}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 mb-4">
                          <Badge className={estadoConfig.color}>
                            {estadoConfig.label}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {t.fecha_inicio ? formatDate(t.fecha_inicio) : 'Sin fecha'}
                          </div>
                        </div>

                        {/* Escuela del estudiante */}
                        {t.estudiante?.escuela && (
                          <div className="mb-4 text-xs text-muted-foreground">
                            {t.estudiante.escuela.nombre}
                          </div>
                        )}

                        {/* Asesor principal */}
                        {t.asesor_principal && (
                          <div className="mb-4 pb-4 border-b">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <GraduationCap className="h-4 w-4" />
                              <span>
                                Asesor: {t.asesor_principal.usuario?.nombres} {t.asesor_principal.usuario?.apellidos}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Nota final */}
                        {t.acta && t.acta.nota_final && (
                          <div className="mb-4 pb-4 border-b">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Nota Final:</span>
                              <span className="text-lg font-bold text-primary">
                                {t.acta.nota_final}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <Link href={`/tesis/${t.id}`}>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
                          {(hasRole('admin') || hasRole('coordinador') || hasRole('asesor')) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(t)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  {searchTerm 
                    ? 'No se encontraron tesis que coincidan con la búsqueda'
                    : hasRole('estudiante')
                    ? 'Aún no tienes tesis registradas'
                    : 'No hay tesis registradas'}
                </p>
                {canCreateTesis && !searchTerm && (
                  <Link href="/tesis/nueva">
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      {hasRole('estudiante') ? 'Registrar Mi Tesis' : 'Registrar Nueva Tesis'}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de edición */}
      <Dialog
        open={!!editingTesis}
        onClose={closeEditModal}
        title="Editar Tesis"
      >
        {editingTesis && (
          <TesisEditForm
            tesis={editingTesis}
            adminMode={adminEdit}
            asesores={asesorOptions}
            onSubmit={handleEditTesis}
            onCancel={closeEditModal}
            isLoading={isEditing}
          />
        )}
      </Dialog>
    </div>
  );
}
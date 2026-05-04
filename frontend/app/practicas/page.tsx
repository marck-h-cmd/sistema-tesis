'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ofertasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Users,
  Building2,
  Briefcase,
  Eye,
  Edit
} from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/utils/formatDate';
import { PracticaEditForm } from '@/components/forms/PracticaEditForm';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function PracticasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPractica, setEditingPractica] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { hasRole } = useAuth();

  const { data: ofertas, isLoading, refetch } = useQuery({
    queryKey: ['ofertas'],
    queryFn: () => ofertasApi.getAll().then(res => res.data.data),
  });

  const filteredOfertas = ofertas?.filter((oferta: any) =>
    oferta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    oferta.empresa.razon_social.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditPractica = async (data: any) => {
    if (!editingPractica) return;

    setIsEditing(true);
    try {
      await ofertasApi.update(editingPractica.id, data);
      toast.success('Práctica actualizada exitosamente');
      setEditingPractica(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar la práctica');
    } finally {
      setIsEditing(false);
    }
  };

  const openEditModal = (practica: any) => {
    setEditingPractica(practica);
  };

  const closeEditModal = () => {
    setEditingPractica(null);
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { color: string; label: string }> = {
      abierta: { color: 'bg-green-100 text-green-800', label: 'Abierta' },
      cerrada: { color: 'bg-red-100 text-red-800', label: 'Cerrada' },
    };
    const config = estados[estado] || { color: 'bg-gray-100 text-gray-800', label: estado };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getModalidadBadge = (modalidad: string) => {
    const modalidades: Record<string, string> = {
      presencial: 'bg-blue-100 text-blue-800',
      remota: 'bg-green-100 text-green-800',
      hibrida: 'bg-purple-100 text-purple-800',
    };
    return (
      <Badge className={modalidades[modalidad] || 'bg-gray-100 text-gray-800'}>
        {modalidad}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} /> */}
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Prácticas Preprofesionales</h1>
              <p className="text-muted-foreground mt-1">
                Ofertas de prácticas disponibles
              </p>
            </div>
            {(hasRole('admin') || hasRole('coordinador') || hasRole('empresa')) && (
              <Link href="/practicas/nueva">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Oferta
                </Button>
              </Link>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar ofertas de práctica..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Ofertas Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOfertas?.map((oferta: any) => (
                <Card key={oferta.id} className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{oferta.titulo}</h3>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {oferta.empresa.razon_social}
                        </p>
                      </div>
                      {getEstadoBadge(oferta.estado)}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {oferta.descripcion}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {getModalidadBadge(oferta.modalidad)}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {formatDuration(oferta.fecha_inicio, oferta.fecha_fin)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{oferta.vacantes} vacantes</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-muted-foreground">
                          Inicio: {formatDate(oferta.fecha_inicio)}
                        </span>
                        {oferta._count && (
                          <span className="text-primary font-medium">
                            {oferta._count.postulaciones} postulantes
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/practicas/${oferta.id}`}>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                        {(hasRole('admin') || hasRole('coordinador')) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(oferta)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredOfertas?.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No se encontraron ofertas de práctica</p>
              {hasRole('admin') || hasRole('coordinador') || hasRole('empresa') ? (
                <Link href="/practicas/nueva">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Nueva Oferta
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-gray-500 mt-2">
                  No hay ofertas disponibles en este momento
                </p>
              )}
            </div>
          )}
        </main>
      {/* </div> */}

      {/* Modal de edición */}
      <Dialog
        open={!!editingPractica}
        onClose={closeEditModal}
        title="Editar Práctica"
      >
        {editingPractica && (
          <PracticaEditForm
            practica={editingPractica}
            onSubmit={handleEditPractica}
            onCancel={closeEditModal}
            isLoading={isEditing}
          />
        )}
      </Dialog>
    </div>
  );
}
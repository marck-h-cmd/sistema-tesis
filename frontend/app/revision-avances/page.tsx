'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tesisApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Search, Eye, CheckCircle, XCircle, GraduationCap, User, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface AvancePendiente {
  id: number;
  tipo: string;
  descripcion: string;
  fecha_entrega: string;
  estado: string;
  observaciones?: string;
  tesis: {
    id: number;
    titulo: string;
    estudiante: {
      usuario: {
        nombres: string;
        apellidos: string;
      };
    };
    asesor_principal: {
      usuario: {
        nombres: string;
        apellidos: string;
      };
    };
  };
}

export default function RevisionAvancesPage() {
  const { hasRole } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingAvance, setReviewingAvance] = useState<AvancePendiente | null>(null);
  const [reviewObservaciones, setReviewObservaciones] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Query para obtener todas las tesis con sus avances
  const { data: tesis, isLoading, refetch } = useQuery({
    queryKey: ['tesis-con-avances'],
    queryFn: async () => {
      const response = await tesisApi.getAll();
      console.log('Tesis obtenidas para revisión de avances:', response.data.data);
      
      // Para cada tesis, obtener sus avances
      const tesisConAvances = await Promise.all(
        response.data.data.map(async (t: any) => {
          try {
            const avancesResponse = await tesisApi.getAvances(t.id);
            return {
              ...t,
              avances: avancesResponse.data.data || []
            };
          } catch (error) {
            console.error(`Error obteniendo avances para tesis ${t.id}:`, error);
            return {
              ...t,
              avances: []
            };
          }
        })
      );
      
      return tesisConAvances;
    },
    enabled: hasRole('admin') || hasRole('asesor') || hasRole('coordinador'),
  });

  // Filtrar avances pendientes de revisión
  const avancesPendientes = tesis?.flatMap((t: any) =>
    t.avances
      .filter((a: any) => a.estado === 'pendiente' || a.estado === 'entregado')
      .map((a: any) => ({
        ...a,
        tesis: {
          id: t.id,
          titulo: t.titulo,
          estudiante: t.estudiante,
          asesor_principal: t.asesor_principal,
        },
      }))
  ) || [];

  // Filtrar por búsqueda
  const filteredAvances = avancesPendientes.filter((avance: AvancePendiente) =>
    avance.tesis.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avance.tesis.estudiante.usuario.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avance.tesis.estudiante.usuario.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avance.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRevisarAvance = async (avanceId: number, estado: string) => {
    if (!reviewingAvance) return;

    setIsReviewing(true);
    try {
      await tesisApi.revisarAvance(avanceId, estado, reviewObservaciones || undefined);
      toast.success(`Avance ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} exitosamente`);
      setReviewingAvance(null);
      setReviewObservaciones('');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al revisar el avance');
    } finally {
      setIsReviewing(false);
    }
  };

  const openReviewModal = (avance: AvancePendiente) => {
    setReviewingAvance(avance);
    setReviewObservaciones(avance.observaciones || '');
  };

  const closeReviewModal = () => {
    setReviewingAvance(null);
    setReviewObservaciones('');
  };

  if (!hasRole('admin') && !hasRole('asesor') && !hasRole('coordinador')) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Revisión de Avances</h1>
            <p className="text-muted-foreground mt-1">
              Avances de tesis pendientes de revisión
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Buscar por tesis, estudiante o tipo de avance..."
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
            {/* Avances pendientes */}
            {filteredAvances.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAvances.map((avance: AvancePendiente) => (
                  <Card key={avance.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {avance.tesis.titulo}
                          </CardTitle>
                          <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <User className="h-4 w-4 mr-1" />
                            {avance.tesis.estudiante.usuario.nombres} {avance.tesis.estudiante.usuario.apellidos}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            Asesor: {avance.tesis.asesor_principal.usuario.nombres} {avance.tesis.asesor_principal.usuario.apellidos}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium capitalize text-primary">{avance.tipo}</p>
                          <p className="text-sm text-gray-600 mt-1">{avance.descripcion}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(avance.fecha_entrega)}
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {avance.estado}
                          </Badge>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Link href={`/tesis/${avance.tesis.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver tesis
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => openReviewModal(avance)}
                          >
                            Revisar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  {searchTerm
                    ? 'No se encontraron avances que coincidan con la búsqueda'
                    : 'No hay avances pendientes de revisión'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Todos los avances han sido revisados
                </p>
              </div>
            )}
          </>
        )}

        {/* Modal de revisión */}
        <Dialog
          open={!!reviewingAvance}
          onClose={closeReviewModal}
          title="Revisar Avance"
        >
          {reviewingAvance && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{reviewingAvance.tesis.titulo}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Estudiante: {reviewingAvance.tesis.estudiante.usuario.nombres} {reviewingAvance.tesis.estudiante.usuario.apellidos}
                </p>
                <div className="mt-3 pt-3 border-t">
                  <p className="font-medium capitalize">{reviewingAvance.tipo}</p>
                  <p className="text-sm text-gray-600 mt-1">{reviewingAvance.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Entregado: {formatDate(reviewingAvance.fecha_entrega)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observaciones (opcional)</label>
                <Textarea
                  value={reviewObservaciones}
                  onChange={(e) => setReviewObservaciones(e.target.value)}
                  placeholder="Agregue observaciones o comentarios sobre el avance..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeReviewModal}
                  disabled={isReviewing}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleRevisarAvance(reviewingAvance.id, 'observado')}
                  disabled={isReviewing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isReviewing ? 'Procesando...' : 'Rechazar'}
                </Button>
                <Button
                  onClick={() => handleRevisarAvance(reviewingAvance.id, 'aprobado')}
                  disabled={isReviewing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isReviewing ? 'Procesando...' : 'Aprobar'}
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ofertasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Building2,
  Calendar,
  FileText,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatDuration } from '@/lib/utils/formatDate';
import { toast } from 'sonner';

export default function OfertaDetailPage() {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasRole } = useAuth();
  const [isPostulando, setIsPostulando] = useState(false);

  const { data: oferta, isLoading } = useQuery({
    queryKey: ['oferta', id],
    queryFn: () => ofertasApi.getOne(Number(id)).then(res => res.data.data),
  });

  const handlePostular = async () => {
    setIsPostulando(true);
    try {
      await ofertasApi.postular(Number(id), {
        estudiante_id: user?.id,
      });
      toast.success('Postulación realizada exitosamente');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al postular');
    } finally {
      setIsPostulando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!oferta) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Oferta no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/practicas"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a prácticas
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl">{oferta.titulo}</CardTitle>
                        <p className="text-muted-foreground mt-1 flex items-center">
                          <Building2 className="h-4 w-4 mr-1" />
                          {oferta.empresa.razon_social}
                        </p>
                      </div>
                      <Badge className={oferta.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {oferta.estado}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Descripción</h3>
                        <p className="text-gray-700">{oferta.descripcion}</p>
                      </div>

                      {oferta.requisitos && (
                        <div>
                          <h3 className="font-semibold mb-2">Requisitos</h3>
                          <p className="text-gray-700">{oferta.requisitos}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="capitalize">{oferta.modalidad}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{oferta.vacantes} vacantes</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Inicio: {formatDate(oferta.fecha_inicio)}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{formatDuration(oferta.fecha_inicio, oferta.fecha_fin)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Postulaciones */}
                {hasRole('admin') || hasRole('coordinador') ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Postulaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {oferta.postulaciones?.map((post: any) => (
                          <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <p className="font-medium">
                                {post.estudiante.usuario.nombres} {post.estudiante.usuario.apellidos}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {post.estudiante.escuela.nombre} • {post.estado}
                              </p>
                            </div>
                            <Badge className={
                              post.estado === 'aceptado' ? 'bg-green-100 text-green-800' :
                              post.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {post.estado}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Información de la Empresa</h3>
                    <div className="space-y-3">
                      <p className="text-sm">
                        <span className="text-muted-foreground">RUC:</span>{' '}
                        {oferta.empresa.ruc}
                      </p>
                      {oferta.empresa.direccion && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Dirección:</span>{' '}
                          {oferta.empresa.direccion}
                        </p>
                      )}
                      {oferta.empresa.telefono && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Teléfono:</span>{' '}
                          {oferta.empresa.telefono}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {hasRole('estudiante') && oferta.estado === 'abierta' && (
                  <Button
                    className="w-full"
                    onClick={handlePostular}
                    disabled={isPostulando}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isPostulando ? 'Postulando...' : 'Postular a esta oferta'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
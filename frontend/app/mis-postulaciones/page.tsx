'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ofertasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

const estadoConfig: Record<string, { color: string; label: string; icon: any }> = {
  postulado: { color: 'bg-yellow-100 text-yellow-800', label: 'Postulado', icon: ClockIcon },
  aceptado: { color: 'bg-green-100 text-green-800', label: 'Aceptado', icon: CheckCircle },
  rechazado: { color: 'bg-red-100 text-red-800', label: 'Rechazado', icon: XCircle },
  en_curso: { color: 'bg-blue-100 text-blue-800', label: 'En Curso', icon: TrendingUp },
  finalizado: { color: 'bg-gray-100 text-gray-800', label: 'Finalizado', icon: CheckCircle },
};

export default function MisPostulacionesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('todas');

  
  const { data: postulaciones, isLoading, error, refetch } = useQuery({
    queryKey: ['mis-postulaciones'],
    queryFn: async () => {
      try {
        const response = await ofertasApi.getMisPostulaciones();
        console.log('Respuesta del API:', response); // Debug
        return response.data.data;
      } catch (err) {
        console.error('Error detallado:', err);
        throw err;
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const getPostulacionesByEstado = (estado?: string) => {
    if (!postulaciones) return [];
    if (!estado || estado === 'todas') return postulaciones;
    return postulaciones.filter((p: any) => p.estado === estado);
  };

  const getEstadisticas = () => {
    if (!postulaciones) return { total: 0, aceptadas: 0, pendientes: 0, finalizadas: 0 };
    
    const total = postulaciones.length;
    const aceptadas = postulaciones.filter((p: any) => p.estado === 'aceptado' || p.estado === 'en_curso').length;
    const pendientes = postulaciones.filter((p: any) => p.estado === 'postulado').length;
    const finalizadas = postulaciones.filter((p: any) => p.estado === 'finalizado').length;
    
    return { total, aceptadas, pendientes, finalizadas };
  };

  const estadisticas = getEstadisticas();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">Error al cargar tus postulaciones</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Postulaciones</h1>
          <p className="text-muted-foreground mt-1">
            Historial de tus postulaciones a prácticas preprofesionales
          </p>
        </div>

        {/* Estadísticas */}
        {postulaciones && postulaciones.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{estadisticas.total}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aceptadas</p>
                    <p className="text-2xl font-bold text-green-600">{estadisticas.aceptadas}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Finalizadas</p>
                    <p className="text-2xl font-bold text-gray-600">{estadisticas.finalizadas}</p>
                  </div>
                  <FileText className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs usando shadcn/ui */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="todas">
              Todas ({postulaciones?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="postulado">
              Pendientes ({getPostulacionesByEstado('postulado').length})
            </TabsTrigger>
            <TabsTrigger value="aceptado">
              Aceptadas ({getPostulacionesByEstado('aceptado').length})
            </TabsTrigger>
            <TabsTrigger value="en_curso">
              En Curso ({getPostulacionesByEstado('en_curso').length})
            </TabsTrigger>
            <TabsTrigger value="finalizado">
              Finalizadas ({getPostulacionesByEstado('finalizado').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="mt-6">
            {getPostulacionesByEstado('todas').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPostulacionesByEstado('todas').map((postulacion: any) => (
                  <PostulacionCard key={postulacion.id} postulacion={postulacion} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="postulado" className="mt-6">
            {getPostulacionesByEstado('postulado').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPostulacionesByEstado('postulado').map((postulacion: any) => (
                  <PostulacionCard key={postulacion.id} postulacion={postulacion} />
                ))}
              </div>
            ) : (
              <EmptyState tabName="pendientes" />
            )}
          </TabsContent>

          <TabsContent value="aceptado" className="mt-6">
            {getPostulacionesByEstado('aceptado').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPostulacionesByEstado('aceptado').map((postulacion: any) => (
                  <PostulacionCard key={postulacion.id} postulacion={postulacion} />
                ))}
              </div>
            ) : (
              <EmptyState tabName="aceptadas" />
            )}
          </TabsContent>

          <TabsContent value="en_curso" className="mt-6">
            {getPostulacionesByEstado('en_curso').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPostulacionesByEstado('en_curso').map((postulacion: any) => (
                  <PostulacionCard key={postulacion.id} postulacion={postulacion} />
                ))}
              </div>
            ) : (
              <EmptyState tabName="en curso" />
            )}
          </TabsContent>

          <TabsContent value="finalizado" className="mt-6">
            {getPostulacionesByEstado('finalizado').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPostulacionesByEstado('finalizado').map((postulacion: any) => (
                  <PostulacionCard key={postulacion.id} postulacion={postulacion} />
                ))}
              </div>
            ) : (
              <EmptyState tabName="finalizadas" />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Componente para cada tarjeta de postulación
function PostulacionCard({ postulacion }: { postulacion: any }) {
  const EstadoIcon = estadoConfig[postulacion.estado]?.icon || Briefcase;
  const estado = estadoConfig[postulacion.estado] || { 
    color: 'bg-gray-100 text-gray-800', 
    label: postulacion.estado,
    icon: Briefcase
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge className={estado.color}>
            <EstadoIcon className="h-3 w-3 mr-1" />
            {estado.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(postulacion.fecha_postulacion)}
          </span>
        </div>

        <Link href={`/practicas/${postulacion.oferta.id}`}>
          <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
            {postulacion.oferta.titulo}
          </h3>
        </Link>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Building2 className="h-4 w-4 mr-1" />
          {postulacion.oferta.empresa.razon_social}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>Inicio: {formatDate(postulacion.oferta.fecha_inicio)}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>Fin: {formatDate(postulacion.oferta.fecha_fin)}</span>
          </div>
          <div className="flex items-center text-sm">
            <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
            <span className="capitalize">Modalidad: {postulacion.oferta.modalidad}</span>
          </div>
        </div>

        {postulacion.seguimiento && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso:</span>
              <span className="font-medium">
                {postulacion.seguimiento.horas_cumplidas} / {postulacion.seguimiento.horas_totales} horas
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{
                  width: `${(postulacion.seguimiento.horas_cumplidas / postulacion.seguimiento.horas_totales) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Link href={`/practicas/${postulacion.oferta.id}`}>
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Ver Oferta
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para estado vacío
function EmptyState({ tabName }: { tabName?: string }) {
  return (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-lg text-gray-600">
        {!tabName 
          ? 'Aún no tienes postulaciones' 
          : `No tienes postulaciones ${tabName}`}
      </p>
      <Link href="/practicas">
        <Button className="mt-4">
          Ver Ofertas Disponibles
        </Button>
      </Link>
    </div>
  );
}
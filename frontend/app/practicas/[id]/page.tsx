'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ofertasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Calendar,
  Send,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

export default function OfertaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole, user } = useAuth();
  const [isPostulando, setIsPostulando] = useState(false);

  const ofertaId = parseInt(params.id as string);

  // Obtener detalles de la oferta
  const { data: oferta, isLoading, refetch } = useQuery({
    queryKey: ['oferta', ofertaId],
    queryFn: () => ofertasApi.getOne(ofertaId).then(res => res.data.data),
    enabled: !isNaN(ofertaId),
  });

  // Verificar si el estudiante ya se postuló
  const { data: postulaciones, refetch: refetchPostulaciones } = useQuery({
    queryKey: ['postulacionesOferta', ofertaId],
    queryFn: () => ofertasApi.getPostulaciones(ofertaId).then(res => res.data.data),
    enabled: hasRole('estudiante') && !!ofertaId,
  });

  const yaPostulo = postulaciones?.some(
    (p: any) => p.estudiante?.usuario_id === user?.id
  );

  // Mutación para postular
  const postularMutation = useMutation({
    mutationFn: async () => {
      const response = await ofertasApi.postular(ofertaId, {}); // Body vacío porque el backend obtiene el estudiante del token
      return response.data;
    },
    onSuccess: () => {
      toast.success('Postulación realizada exitosamente');
      refetch();
      refetchPostulaciones();
      router.push('/mis-postulaciones');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al postular';
      toast.error(message);
    },
    onSettled: () => {
      setIsPostulando(false);
    },
  });

  const handlePostular = async () => {
    setIsPostulando(true);
    postularMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!oferta) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600">Oferta no encontrada</p>
        <Button onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const isOfertaAbierta = oferta.estado === 'abierta';
  const puedePostular = hasRole('estudiante') && isOfertaAbierta && !yaPostulo;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card>
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{oferta.titulo}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-5 w-5" />
                  <span className="text-lg">{oferta.empresa?.razon_social || 'Empresa no especificada'}</span>
                </div>
              </div>
              <Badge className={isOfertaAbierta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {isOfertaAbierta ? 'Abierta' : 'Cerrada'}
              </Badge>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium">Modalidad:</span>
                  <span className="ml-2 capitalize">{oferta.modalidad}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium">Vacantes:</span>
                  <span className="ml-2">{oferta.vacantes}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium">Fecha de inicio:</span>
                  <span className="ml-2">{formatDate(oferta.fecha_inicio)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium">Fecha de fin:</span>
                  <span className="ml-2">{formatDate(oferta.fecha_fin)}</span>
                </div>
                {oferta._count && (
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-5 w-5 mr-2 text-gray-400" />
                    <span className="font-medium">Postulantes:</span>
                    <span className="ml-2">{oferta._count.postulaciones || 0}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{oferta.descripcion}</p>
            </div>

            {/* Requisitos */}
            {oferta.requisitos && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Requisitos</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{oferta.requisitos}</p>
              </div>
            )}

            {/* Botón de postulación */}
            {hasRole('estudiante') && (
              <div className="mt-8 pt-6 border-t">
                {yaPostulo ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-700">
                      ✓ Ya te has postulado a esta oferta
                    </span>
                  </div>
                ) : isOfertaAbierta ? (
                  <Button
                    onClick={handlePostular}
                    disabled={postularMutation.isPending}
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    {postularMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Postularme
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-600">
                      Esta oferta ya no está disponible
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mostrar postulaciones (solo para admin/coordinador/asesor) */}
            {(hasRole('admin') || hasRole('coordinador') || hasRole('asesor')) && postulaciones && postulaciones.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold mb-4">Postulaciones</h2>
                <div className="space-y-3">
                  {postulaciones.map((postulacion: any) => (
                    <div key={postulacion.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {postulacion.estudiante?.usuario?.nombres} {postulacion.estudiante?.usuario?.apellidos}
                          </p>
                          <p className="text-sm text-gray-600">
                            Código: {postulacion.estudiante?.codigo_universitario}
                          </p>
                          <p className="text-sm text-gray-600">
                            Escuela: {postulacion.estudiante?.escuela?.nombre}
                          </p>
                        </div>
                        <Badge className={
                          postulacion.estado === 'postulado' ? 'bg-yellow-100 text-yellow-800' :
                          postulacion.estado === 'aceptado' ? 'bg-green-100 text-green-800' :
                          postulacion.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {postulacion.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
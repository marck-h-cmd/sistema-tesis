'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tesisApi } from '@/lib/api/endpoints';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, School, FileText, Star } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

const estadosTesis: Record<string, { color: string; label: string }> = {
  propuesta: { color: 'bg-blue-100 text-blue-800', label: 'Propuesta' },
  desarrollo: { color: 'bg-yellow-100 text-yellow-800', label: 'En Desarrollo' },
  sustentacion: { color: 'bg-purple-100 text-purple-800', label: 'En Sustentación' },
  culminado: { color: 'bg-green-100 text-green-800', label: 'Culminado' },
};

export default function TesisDetailPage() {
  const { id } = useParams();

  const { data: tesis, isLoading } = useQuery({
    queryKey: ['tesis', id],
    queryFn: () => tesisApi.getOne(Number(id)).then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tesis) {
    return <p className="text-center py-12 text-gray-500">Tesis no encontrada</p>;
  }

  const estadoConfig = estadosTesis[tesis.estado] || { color: 'bg-gray-100 text-gray-800', label: tesis.estado };

  return (
    <div>
      <Link href="/tesis" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a tesis
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{tesis.titulo}</CardTitle>
                <Badge className={estadoConfig.color}>{estadoConfig.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {tesis.resumen && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Resumen</h3>
                  <p className="text-gray-700">{tesis.resumen}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Estudiante</p>
                    <p className="font-medium">{tesis.estudiante?.usuario?.nombres} {tesis.estudiante?.usuario?.apellidos}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Asesor</p>
                    <p className="font-medium">{tesis.asesor_principal?.usuario?.nombres} {tesis.asesor_principal?.usuario?.apellidos}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <School className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Escuela</p>
                    <p className="font-medium">{tesis.estudiante?.escuela?.nombre}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Fecha de inicio</p>
                    <p className="font-medium">{tesis.fecha_inicio ? formatDate(tesis.fecha_inicio) : 'No definida'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jurados */}
          {tesis.jurados?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Jurados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tesis.jurados.map((jurado: any) => (
                    <div key={jurado.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{jurado.asesor.usuario.nombres} {jurado.asesor.usuario.apellidos}</p>
                        <p className="text-sm text-muted-foreground">{jurado.asesor.especialidad}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{jurado.rol}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avances */}
          {tesis.avances?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Avances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tesis.avances.map((avance: any) => (
                    <div key={avance.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium capitalize">{avance.tipo}</p>
                          <p className="text-sm text-gray-600 mt-1">{avance.descripcion}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Entregado: {formatDate(avance.fecha_entrega)}
                          </p>
                        </div>
                        <Badge className={
                          avance.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                          avance.estado === 'observado' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {avance.estado}
                        </Badge>
                      </div>
                      {avance.observaciones && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                          {avance.observaciones}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {tesis.acta && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Acta de Sustentación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">{formatDate(tesis.acta.fecha)}</p>
                  </div>
                  {tesis.acta.lugar && (
                    <div>
                      <p className="text-sm text-muted-foreground">Lugar</p>
                      <p className="font-medium">{tesis.acta.lugar}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Nota Final</p>
                    <p className="text-3xl font-bold text-primary">{tesis.acta.nota_final}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Acciones</h3>
              <div className="space-y-2">
                <Button className="w-full" variant="outline" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver documento
                </Button>
                <Button className="w-full" variant="outline" disabled>
                  Descargar informe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
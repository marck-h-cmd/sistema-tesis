'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { empresasApi } from '@/lib/api/endpoints';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Building2, Mail, Phone, MapPin, FileCheck, Briefcase } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

export default function EmpresaDetailPage() {
  const { id } = useParams();

  const { data: empresa, isLoading } = useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresasApi.getOne(Number(id)).then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!empresa) {
    return <p className="text-center py-12 text-gray-500">Empresa no encontrada</p>;
  }

  return (
    <div>
      <Link href="/empresas" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a empresas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{empresa.razon_social}</CardTitle>
                <Badge className={empresa.convenio_activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {empresa.convenio_activo ? 'Convenio Vigente' : 'Sin Convenio'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">{empresa.direccion || 'No registrada'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{empresa.telefono || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email de contacto</p>
                    <p className="font-medium">{empresa.email_contacto || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Building2 className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">RUC</p>
                    <p className="font-medium">{empresa.ruc}</p>
                  </div>
                </div>
              </div>
              {empresa.representante && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Representante</p>
                  <p className="font-medium">{empresa.representante}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Convenios */}
          {empresa.convenios?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Convenios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {empresa.convenios.map((convenio: any) => (
                    <div key={convenio.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="capitalize">{convenio.tipo}</Badge>
                        <Badge className={convenio.estado === 'vigente' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {convenio.estado}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Inicio: {formatDate(convenio.fecha_inicio)}</p>
                        <p>Fin: {formatDate(convenio.fecha_fin)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ofertas activas */}
          {empresa.ofertas?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Ofertas Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {empresa.ofertas.map((oferta: any) => (
                    <Link key={oferta.id} href={`/practicas/${oferta.id}`}>
                      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="font-medium">{oferta.titulo}</p>
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <span className="capitalize">{oferta.modalidad}</span>
                          <span className="mx-2">•</span>
                          <span>{oferta.vacantes} vacantes</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Ofertas</span>
                  <span className="font-bold">{empresa._count?.ofertas || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Convenios</span>
                  <span className="font-bold">{empresa._count?.convenios || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
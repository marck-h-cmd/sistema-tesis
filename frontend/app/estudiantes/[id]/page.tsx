'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { estudiantesApi } from '@/lib/api/endpoints';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, School, BookOpen, Briefcase } from 'lucide-react';

export default function EstudianteDetailPage() {
  const { id } = useParams();

  const { data: estudiante, isLoading } = useQuery({
    queryKey: ['estudiante', id],
    queryFn: () => estudiantesApi.getOne(Number(id)).then(res => res.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!estudiante) {
    return <p className="text-center py-12 text-gray-500">Estudiante no encontrado</p>;
  }

  return (
    <div>
      <Link href="/estudiantes" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a estudiantes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre completo</p>
                  <p className="font-medium text-lg">{estudiante.usuario.nombres} {estudiante.usuario.apellidos}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-medium text-lg">{estudiante.codigo_universitario}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{estudiante.usuario.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DNI</p>
                  <p className="font-medium">{estudiante.usuario.dni}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Escuela</p>
                  <p className="font-medium">{estudiante.escuela.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Facultad</p>
                  <p className="font-medium">{estudiante.escuela.facultad}</p>
                </div>
              </div>
              {estudiante.ciclo && (
                <Badge className="mt-4">{estudiante.ciclo} ciclo</Badge>
              )}
            </CardContent>
          </Card>

          {/* Prácticas */}
          {Array.isArray(estudiante.postulaciones) && estudiante.postulaciones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Prácticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estudiante.postulaciones?.map((post: any) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{post.oferta.titulo}</p>
                          <p className="text-sm text-muted-foreground">{post.oferta.empresa.razon_social}</p>
                        </div>
                        <Badge className={
                          post.estado === 'finalizado' ? 'bg-green-100 text-green-800' :
                          post.estado === 'en_curso' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {post.estado.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tesis */}
          {Array.isArray(estudiante.tesis) && estudiante.tesis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Tesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estudiante.tesis?.map((t: any) => (
                    <div key={t.id} className="border rounded-lg p-4">
                      <p className="font-medium">{t.titulo}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Asesor: {t.asesor_principal?.usuario?.nombres} {t.asesor_principal?.usuario?.apellidos}
                      </p>
                      <Badge className="mt-2">{t.estado}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Resumen</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prácticas</span>
                  <span className="font-bold">{estudiante.postulaciones?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tesis</span>
                  <span className="font-bold">{estudiante.tesis?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
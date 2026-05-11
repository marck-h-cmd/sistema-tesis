'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estudiantesApi, practicasApi } from '@/lib/api/endpoints';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Briefcase, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

const estadosPractica = [
  'plan_pendiente',
  'plan_validado',
  'en_ejecucion',
  'informe_pendiente',
  'aprobado',
] as const;

export default function EstudianteDetailPage() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const puedeAdminPractica = hasRole('admin') || hasRole('coordinador');

  const [adminForm, setAdminForm] = useState<Record<number, {
    horas_totales: string;
    horas_cumplidas: string;
    fecha_inicio: string;
    fecha_fin_estimada: string;
    estado: string;
  }>>({});

  const { data: estudiante, isLoading } = useQuery({
    queryKey: ['estudiante', id],
    queryFn: () => estudiantesApi.getOne(Number(id)).then(res => res.data.data),
  });

  const mPracticaAdmin = useMutation({
    mutationFn: ({ practicaId, body }: { practicaId: number; body: Record<string, unknown> }) =>
      practicasApi.updateAdmin(practicaId, body),
    onSuccess: () => {
      toast.success('Práctica actualizada');
      qc.invalidateQueries({ queryKey: ['estudiante', id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
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
                    <div key={post.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{post.oferta.titulo}</p>
                          <p className="text-sm text-muted-foreground">{post.oferta.empresa.razon_social}</p>
                          {post.practica && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Horas: {post.practica.horas_cumplidas} / {post.practica.horas_totales} ·{' '}
                              {post.practica.estado}
                            </p>
                          )}
                        </div>
                        <Badge className={
                          post.estado === 'finalizado' ? 'bg-green-100 text-green-800' :
                          post.estado === 'en_curso' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {post.estado.replace('_', ' ')}
                        </Badge>
                      </div>
                      {post.practica && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/practicas/expediente/${post.id}`}>
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Expediente de práctica
                          </Link>
                        </Button>
                      )}
                      {puedeAdminPractica && post.practica && (() => {
                        const pr = post.practica;
                        const f = adminForm[pr.id] ?? {
                          horas_totales: String(pr.horas_totales ?? ''),
                          horas_cumplidas: String(pr.horas_cumplidas ?? ''),
                          fecha_inicio: pr.fecha_inicio
                            ? String(pr.fecha_inicio).split('T')[0]
                            : '',
                          fecha_fin_estimada: pr.fecha_fin_estimada
                            ? String(pr.fecha_fin_estimada).split('T')[0]
                            : '',
                          estado: pr.estado ?? 'plan_pendiente',
                        };
                        return (
                          <div className="border-t pt-3 mt-2 space-y-2 bg-muted/30 rounded-md p-3">
                            <p className="text-xs font-medium text-muted-foreground">Corrección administrativa</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Horas totales</Label>
                                <Input
                                  value={f.horas_totales}
                                  onChange={(e) =>
                                    setAdminForm((s) => ({
                                      ...s,
                                      [pr.id]: { ...f, horas_totales: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Horas cumplidas</Label>
                                <Input
                                  value={f.horas_cumplidas}
                                  onChange={(e) =>
                                    setAdminForm((s) => ({
                                      ...s,
                                      [pr.id]: { ...f, horas_cumplidas: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Inicio</Label>
                                <Input
                                  type="date"
                                  value={f.fecha_inicio}
                                  onChange={(e) =>
                                    setAdminForm((s) => ({
                                      ...s,
                                      [pr.id]: { ...f, fecha_inicio: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Fin estimado</Label>
                                <Input
                                  type="date"
                                  value={f.fecha_fin_estimada}
                                  onChange={(e) =>
                                    setAdminForm((s) => ({
                                      ...s,
                                      [pr.id]: { ...f, fecha_fin_estimada: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs">Estado práctica</Label>
                              <Select
                                className="w-full"
                                value={f.estado}
                                options={estadosPractica.map((e) => ({ value: e, label: e }))}
                                onChange={(e) =>
                                  setAdminForm((s) => ({
                                    ...s,
                                    [pr.id]: { ...f, estado: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              disabled={mPracticaAdmin.isPending}
                              onClick={() => {
                                const body: Record<string, unknown> = {
                                  horas_totales: parseInt(f.horas_totales, 10),
                                  horas_cumplidas: parseInt(f.horas_cumplidas, 10),
                                  estado: f.estado,
                                };
                                if (f.fecha_inicio) body.fecha_inicio = f.fecha_inicio;
                                if (f.fecha_fin_estimada) {
                                  body.fecha_fin_estimada = f.fecha_fin_estimada;
                                }
                                mPracticaAdmin.mutate({ practicaId: pr.id, body });
                              }}
                            >
                              Guardar práctica
                            </Button>
                          </div>
                        );
                      })()}
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
                    <div key={t.id} className="border rounded-lg p-4 space-y-2">
                      <p className="font-medium">{t.titulo}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Asesor: {t.asesor_principal?.usuario?.nombres} {t.asesor_principal?.usuario?.apellidos}
                      </p>
                      <Badge className="mt-2">{t.estado}</Badge>
                      <div>
                        <Link
                          href={`/tesis/${t.id}`}
                          className="text-sm text-primary underline inline-flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver ficha de tesis
                        </Link>
                      </div>
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
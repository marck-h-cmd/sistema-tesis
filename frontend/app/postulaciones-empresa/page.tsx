'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ofertasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Briefcase,
  Building2,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  TrendingUp,
  Award,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

const estadoPostulacionConfig: Record<string, { color: string; label: string; icon: any }> = {
  postulado: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pendiente', icon: Clock },
  aceptado: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Aceptado', icon: CheckCircle },
  rechazado: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rechazado', icon: XCircle },
  en_curso: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'En Curso', icon: TrendingUp },
  finalizado: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Finalizado', icon: Award },
};

export default function PostulacionesEmpresaPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [expandedOfertas, setExpandedOfertas] = useState<Record<number, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  // Obtener todas las ofertas (filtramos en frontend las de esta empresa)
  const { data: ofertas, isLoading } = useQuery({
    queryKey: ['empresa-ofertas-postulaciones'],
    queryFn: async () => {
      const res = await ofertasApi.getAll();
      return res.data.data as any[];
    },
  });

  // Obtener postulaciones por oferta (cuando se expande)
  const getPostulacionesQuery = (ofertaId: number) =>
    useQuery({
      queryKey: ['postulaciones-oferta', ofertaId],
      queryFn: async () => {
        const res = await ofertasApi.getPostulaciones(ofertaId);
        // Filtrar sólo las postulaciones de esta oferta
        const all: any[] = res.data.data;
        return all.filter((p: any) => p.oferta_id === ofertaId);
      },
      enabled: !!expandedOfertas[ofertaId],
    });

  const updateEstadoMutation = useMutation({
    mutationFn: async ({ postulacionId, estado }: { postulacionId: number; estado: string }) => {
      const res = await ofertasApi.updateEstadoPostulacion(postulacionId, { estado });
      return res.data;
    },
    onSuccess: (_, { postulacionId, estado }) => {
      toast.success(estado === 'aceptado' ? '✅ Postulación aceptada' : '❌ Postulación rechazada');
      // Invalidar todas las queries de postulaciones
      queryClient.invalidateQueries({ queryKey: ['postulaciones-oferta'] });
      queryClient.invalidateQueries({ queryKey: ['empresa-ofertas-postulaciones'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la postulación');
    },
  });

  const handleUpdateEstado = async (postulacionId: number, ofertaId: number, estado: string) => {
    setActionLoading(prev => ({ ...prev, [postulacionId]: true }));
    try {
      await updateEstadoMutation.mutateAsync({ postulacionId, estado });
    } finally {
      setActionLoading(prev => ({ ...prev, [postulacionId]: false }));
    }
  };

  const toggleOferta = (ofertaId: number) => {
    setExpandedOfertas(prev => ({ ...prev, [ofertaId]: !prev[ofertaId] }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Cargando postulaciones...</p>
      </div>
    );
  }

  // Si es empresa, mostrar solo sus ofertas. Si es asesor/admin, mostrar todas
  const misOfertas = ofertas || [];

  const totalPostulaciones = misOfertas.reduce((acc: number, o: any) => acc + (o._count?.postulaciones || 0), 0);
  const ofertasAbiertas = misOfertas.filter((o: any) => o.estado === 'abierta').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 h-64 w-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-0 left-8 h-48 w-48 rounded-full bg-indigo-400 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <Briefcase className="h-5 w-5 text-blue-300" />
            </div>
            <span className="text-sm font-medium text-blue-300 uppercase tracking-wider">Panel de Empresa</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Postulaciones a mis Prácticas</h1>
          <p className="text-slate-300 text-sm">
            Gestiona las postulaciones recibidas — revisa los CVs y acepta o rechaza candidatos
          </p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">


        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 shadow-md shadow-amber-200">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalPostulaciones}</p>
              <p className="text-sm text-slate-500">Total Postulantes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de ofertas con postulaciones */}
      {misOfertas.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No hay ofertas registradas</h3>
            <p className="text-sm text-muted-foreground mt-1">Las ofertas de práctica aparecerán aquí cuando sean creadas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {misOfertas.map((oferta: any) => (
            <OfertaConPostulaciones
              key={oferta.id}
              oferta={oferta}
              isExpanded={!!expandedOfertas[oferta.id]}
              onToggle={() => toggleOferta(oferta.id)}
              onUpdateEstado={handleUpdateEstado}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente separado para cada oferta con sus postulaciones
function OfertaConPostulaciones({
  oferta,
  isExpanded,
  onToggle,
  onUpdateEstado,
  actionLoading,
}: {
  oferta: any;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateEstado: (postulacionId: number, ofertaId: number, estado: string) => void;
  actionLoading: Record<number, boolean>;
}) {
  const { data: postulaciones, isLoading: loadingPostulaciones } = useQuery({
    queryKey: ['postulaciones-oferta', oferta.id],
    queryFn: async () => {
      const res = await ofertasApi.getPostulaciones(oferta.id);
      return res.data.data as any[];
    },
    enabled: isExpanded,
  });

  const pendientes = postulaciones?.filter((p: any) => p.estado === 'postulado').length || 0;
  const aceptados = postulaciones?.filter((p: any) => p.estado === 'aceptado').length || 0;

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header de la oferta */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${oferta.estado === 'abierta' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            <Briefcase className={`h-5 w-5 ${oferta.estado === 'abierta' ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-semibold text-slate-800 truncate">{oferta.titulo}</h3>
              <Badge
                className={`text-xs font-medium border ${oferta.estado === 'abierta' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
              >
                {oferta.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {oferta.vacantes} vacantes disponibles
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(oferta.fecha_inicio)} — {formatDate(oferta.fecha_fin)}
              </span>
              {oferta._count && (
                <span className="flex items-center gap-1 font-medium text-blue-600">
                  <FileText className="h-3.5 w-3.5" />
                  {oferta._count.postulaciones} postulante{oferta._count.postulaciones !== 1 ? 's' : ''}
                </span>
              )}
              {pendientes > 0 && (
                <span className="flex items-center gap-1 font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" />
                  {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 ml-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Postulaciones expandidas */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {loadingPostulaciones ? (
            <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="text-sm">Cargando postulaciones...</span>
            </div>
          ) : !postulaciones || postulaciones.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No hay postulaciones para esta oferta</p>
              <p className="text-xs mt-1 opacity-70">Los candidatos que se postulen aparecerán aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Resumen por estado */}
              <div className="flex items-center gap-4 px-5 py-3 bg-slate-50/50 text-xs text-slate-500 flex-wrap">
                <span className="font-medium text-slate-700">Resumen:</span>
                <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3 w-3" /> {pendientes} pendientes</span>
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="h-3 w-3" /> {aceptados} aceptados</span>
                <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> {postulaciones.filter((p: any) => p.estado === 'rechazado').length} rechazados</span>
              </div>

              {postulaciones.map((postulacion: any) => {
                const estadoInfo = estadoPostulacionConfig[postulacion.estado] || estadoPostulacionConfig['postulado'];
                const EstadoIcon = estadoInfo.icon;
                const isLoading = actionLoading[postulacion.id];

                return (
                  <div key={postulacion.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors">
                    {/* Avatar con iniciales */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-sm">
                      {(postulacion.estudiante?.usuario?.nombres?.[0] || '?').toUpperCase()}
                      {(postulacion.estudiante?.usuario?.apellidos?.[0] || '').toUpperCase()}
                    </div>

                    {/* Info del estudiante */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {postulacion.estudiante?.usuario?.nombres} {postulacion.estudiante?.usuario?.apellidos}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span>{postulacion.estudiante?.usuario?.email}</span>
                        {postulacion.estudiante?.escuela?.nombre && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                            {postulacion.estudiante.escuela.nombre}
                          </span>
                        )}
                        <span>
                          {formatDate(postulacion.fecha_postulacion)}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Ver CV */}
                      {postulacion.cv_url ? (
                        <a
                          href={`http://localhost:4000${postulacion.cv_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver CV
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin CV</span>
                      )}

                      {/* Badge de estado */}
                      <Badge className={`text-xs font-medium border ${estadoInfo.color} gap-1`}>
                        <EstadoIcon className="h-3 w-3" />
                        {estadoInfo.label}
                      </Badge>

                      {/* Botones de acción (solo si está pendiente) */}
                      {postulacion.estado === 'postulado' && (
                        <>
                          <Button
                            size="sm"
                            className="h-8 gap-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                            onClick={() => onUpdateEstado(postulacion.id, oferta.id, 'aceptado')}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={() => onUpdateEstado(postulacion.id, oferta.id, 'rechazado')}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

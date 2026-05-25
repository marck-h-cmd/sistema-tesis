'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { asesoresApi, practicasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Briefcase,
  CheckCircle,
  Search,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

type PracticaPendiente = any;
type AsesorRow = any;

export default function AsignarAsesorPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPractica, setSelectedPractica] = useState<PracticaPendiente | null>(null);
  const [asesorSearch, setAsesorSearch] = useState('');
  const [selectedAsesorId, setSelectedAsesorId] = useState<number | null>(null);

  const canAssign = hasRole('admin') || hasRole('coordinador');

  const { data: practicas, isLoading } = useQuery({
    queryKey: ['practicas', 'pendientes-asignacion-asesor'],
    queryFn: async () => {
      const res = await practicasApi.pendientesAsignacionAsesor();
      return res.data.data as PracticaPendiente[];
    },
    enabled: canAssign,
  });

  const { data: asesores, isLoading: loadingAsesores } = useQuery({
    queryKey: ['asesores', 'asignar-asesor-modal'],
    queryFn: async () => {
      const res = await asesoresApi.getAll();
      return res.data.data as AsesorRow[];
    },
    enabled: modalOpen,
  });

  const filteredAsesores = useMemo(() => {
    const list = asesores ?? [];
    const q = asesorSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a: any) => {
      const fullName = `${a.usuario?.nombres ?? ''} ${a.usuario?.apellidos ?? ''}`.toLowerCase();
      const email = `${a.usuario?.email ?? ''}`.toLowerCase();
      const escuela = `${a.escuela?.nombre ?? ''}`.toLowerCase();
      return fullName.includes(q) || email.includes(q) || escuela.includes(q);
    });
  }, [asesores, asesorSearch]);

  const asignarAsesorMutation = useMutation({
    mutationFn: async (payload: { practicaId: number; asesorId: number }) => {
      const res = await practicasApi.asignarAsesor(payload.practicaId, {
        asesor_id: payload.asesorId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Asesor asignado. La práctica pasó a "en_ejecucion".');
      queryClient.invalidateQueries({ queryKey: ['practicas', 'pendientes-asignacion-asesor'] });
      setModalOpen(false);
      setSelectedPractica(null);
      setAsesorSearch('');
      setSelectedAsesorId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'No se pudo asignar el asesor');
    },
  });

  if (!canAssign) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Cargando prácticas pendientes...</p>
      </div>
    );
  }

  const pendientes = practicas ?? [];

  const openModal = (practica: PracticaPendiente) => {
    setSelectedPractica(practica);
    setModalOpen(true);
    setAsesorSearch('');
    setSelectedAsesorId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPractica(null);
    setAsesorSearch('');
    setSelectedAsesorId(null);
  };

  const selectedAsesor = (asesores ?? []).find((a: any) => a.id === selectedAsesorId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Asignación de asesor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prácticas aceptadas sin asesor asignado
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
          {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {pendientes.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-14 text-center">
            <Briefcase className="h-14 w-14 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No hay prácticas pendientes
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando haya postulaciones aceptadas sin asesor, aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendientes.map((p: any) => (
            <Card key={p.id} className="border border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">
                      {p.estudiante?.usuario?.nombres} {p.estudiante?.usuario?.apellidos}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {p.postulacion?.oferta?.empresa?.razon_social} · {p.postulacion?.oferta?.titulo}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    Aceptada
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-slate-500">
                  <div className="flex justify-between gap-2">
                    <span>Estado práctica</span>
                    <span className="font-medium text-slate-700">{p.estado}</span>
                  </div>
                  <div className="flex justify-between gap-2 mt-1">
                    <span>Fecha creación</span>
                    <span className="font-medium text-slate-700">{formatDate(p.created_at)}</span>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={() => openModal(p)}>
                  <CheckCircle className="h-4 w-4" />
                  Asignar asesor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onClose={closeModal} title="Asignar asesor">
        {!selectedPractica ? null : (
          <div className="space-y-4">
            <div className="rounded-md border p-3 bg-slate-50">
              <p className="text-sm font-medium text-slate-800">
                {selectedPractica.estudiante?.usuario?.nombres}{' '}
                {selectedPractica.estudiante?.usuario?.apellidos}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPractica.postulacion?.oferta?.empresa?.razon_social} ·{' '}
                {selectedPractica.postulacion?.oferta?.titulo}
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar asesor por nombre, correo o escuela..."
                value={asesorSearch}
                onChange={(e) => setAsesorSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="border rounded-md max-h-72 overflow-auto divide-y">
              {loadingAsesores ? (
                <div className="p-4 text-sm text-muted-foreground">Cargando asesores...</div>
              ) : filteredAsesores.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No hay resultados</div>
              ) : (
                filteredAsesores.map((a: any) => {
                  const isSelected = selectedAsesorId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAsesorId(a.id)}
                      className={`w-full text-left p-3 hover:bg-slate-50 ${isSelected ? 'bg-slate-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {a.usuario?.nombres} {a.usuario?.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {a.usuario?.email} {a.escuela?.nombre ? `· ${a.escuela.nombre}` : ''}
                          </p>
                        </div>
                        {isSelected ? (
                          <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                            Seleccionado
                          </Badge>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground min-w-0">
                {selectedAsesor ? (
                  <span className="truncate">
                    Seleccionado: {selectedAsesor.usuario?.nombres} {selectedAsesor.usuario?.apellidos}
                  </span>
                ) : (
                  <span>Selecciona un asesor para continuar</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedPractica?.id || !selectedAsesorId) return;
                    asignarAsesorMutation.mutate({
                      practicaId: selectedPractica.id,
                      asesorId: selectedAsesorId,
                    });
                  }}
                  disabled={!selectedAsesorId || asignarAsesorMutation.isPending}
                  className="gap-2"
                >
                  {asignarAsesorMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Asignar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

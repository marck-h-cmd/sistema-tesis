'use client';

import { useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { practicasApi, seguimientoApi } from '@/lib/api/endpoints';
import { uploadPdf } from '@/lib/api/uploadPdf';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, FileUp, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/formatDate';

const estadoPracticaLabel: Record<string, string> = {
  plan_pendiente: 'Plan pendiente (espera OK secretaría)',
  plan_validado: 'Plan validado',
  en_ejecucion: 'En ejecución',
  informe_pendiente: 'Informe final — espera firma asesor',
  aprobado: 'Aprobado — práctica cerrada',
};

export default function ExpedientePracticaPage() {
  const params = useParams();
  const router = useRouter();
  const postulacionId = Number(params.postulacionId);
  const { hasRole, user } = useAuth();
  const qc = useQueryClient();

  const [planUrl, setPlanUrl] = useState('');
  const [informeUrl, setInformeUrl] = useState('');
  const [actaUrl, setActaUrl] = useState('');
  const [uploading, setUploading] = useState<'plan' | 'informe' | 'acta' | null>(null);
  const planFileRef = useRef<HTMLInputElement>(null);
  const informeFileRef = useRef<HTMLInputElement>(null);
  const actaFileRef = useRef<HTMLInputElement>(null);
  const [planObs, setPlanObs] = useState('');
  const [informeObs, setInformeObs] = useState('');

  // Reportes mensuales
  const now = new Date();
  const [repAnio, setRepAnio] = useState(String(now.getFullYear()));
  const [repMes, setRepMes] = useState(String(now.getMonth() + 1));
  const [repHoras, setRepHoras] = useState('0');
  const [repObs, setRepObs] = useState('');
  const [repUploading, setRepUploading] = useState(false);
  const repFileRef = useRef<HTMLInputElement>(null);
  const [repValidObs, setRepValidObs] = useState<Record<number, string>>({});

  // ── Queries ────────────────────────────────────────────────────────
  const { data: practica, isLoading, error } = useQuery({
    queryKey: ['practica-postulacion', postulacionId],
    queryFn: () => practicasApi.byPostulacion(postulacionId).then((r) => r.data.data),
    enabled: !Number.isNaN(postulacionId),
  });

  const practicaId = practica?.id as number | undefined;

  const { data: reportesMensuales } = useQuery({
    queryKey: ['practica-reportes-mensuales', practicaId],
    queryFn: () =>
      seguimientoApi
        .listarReportesMensuales(practicaId!)
        .then((r) => r.data.data?.data ?? r.data.data),
    enabled: !!practicaId,
  });

  // ── Derived values (no early returns above this line) ──────────────
  const esEstudiante =
    hasRole('estudiante') &&
    practica?.estudiante?.usuario?.id === user?.id;
  const esSecretaria = hasRole('secretaria') || hasRole('admin');
  const asesorUid = practica?.asesor?.usuario?.id;
  const esAsesorPractica = hasRole('asesor') && user?.id === asesorUid;
  const estadoLabel =
    estadoPracticaLabel[(practica?.estado as keyof typeof estadoPracticaLabel) ?? ''] || (practica?.estado as string) || '';

  const totalHorasValidadas = useMemo(() => {
    const rows = Array.isArray(reportesMensuales) ? reportesMensuales : [];
    return rows
      .filter((r: any) => r.validado)
      .reduce((acc: number, r: any) => acc + (r.horas_reportadas ?? 0), 0);
  }, [reportesMensuales]);

  // ── Mutations ──────────────────────────────────────────────────────
  const mValidar = useMutation({
    mutationFn: (body: { aprobado: boolean; observaciones?: string }) =>
      practicasApi.validarPlan(practica!.id, body),
    onSuccess: () => {
      toast.success('Validación registrada');
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const mPlan = useMutation({
    mutationFn: (args: { archivo_url: string; nombre_original?: string }) =>
      practicasApi.subirPlan(practica!.id, args),
    onSuccess: () => {
      toast.success('Plan registrado');
      setPlanUrl('');
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const mInforme = useMutation({
    mutationFn: (args: { archivo_url: string; nombre_original?: string }) =>
      practicasApi.subirInformeFinal(practica!.id, args),
    onSuccess: () => {
      toast.success('Informe final registrado');
      setInformeUrl('');
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const mActa = useMutation({
    mutationFn: (args: { archivo_url: string; nombre_original?: string }) =>
      practicasApi.subirActaAsesor(practica!.id, args),
    onSuccess: () => {
      toast.success('Acta cargada');
      setActaUrl('');
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const mAprobar = useMutation({
    mutationFn: () =>
      practicasApi.aprobarInforme(practica!.id, {
        acta_aprobacion_url: actaUrl.trim() || undefined,
        observaciones: informeObs.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Informe aprobado — práctica cerrada');
      setActaUrl('');
      setInformeObs('');
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const mSolicitar = useMutation({
    mutationFn: () => practicasApi.solicitarRevisionInforme(practica!.id),
    onSuccess: () => {
      toast.success('Trámite de informe final iniciado');
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const mReporteMensual = useMutation({
    mutationFn: (body: {
      anio: number;
      mes: number;
      horas_reportadas: number;
      archivo_url?: string;
      observaciones?: string;
    }) => seguimientoApi.registrarReporteMensual(practicaId!, body),
    onSuccess: () => {
      toast.success('Reporte mensual registrado');
      setRepHoras('0');
      setRepObs('');
      qc.invalidateQueries({ queryKey: ['practica-reportes-mensuales', practicaId] });
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  const mValidarReporte = useMutation({
    mutationFn: (args: { reporteId: number; validado: boolean; observaciones?: string }) =>
      seguimientoApi.validarReporteMensual(practicaId!, args.reporteId, {
        validado: args.validado,
        observaciones: args.observaciones,
      }),
    onSuccess: () => {
      toast.success('Validación registrada');
      qc.invalidateQueries({ queryKey: ['practica-reportes-mensuales', practicaId] });
      qc.invalidateQueries({ queryKey: ['practica-postulacion', postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Error'),
  });

  // ── Helpers ────────────────────────────────────────────────────────
  const subirPlanDesdeArchivo = async (file: File) => {
    setUploading('plan');
    try {
      const up = await uploadPdf(file);
      mPlan.mutate({ archivo_url: up.url, nombre_original: up.nombre_original });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al subir el PDF');
    } finally {
      setUploading(null);
    }
  };

  const subirInformeDesdeArchivo = async (file: File) => {
    setUploading('informe');
    try {
      const up = await uploadPdf(file);
      mInforme.mutate({ archivo_url: up.url, nombre_original: up.nombre_original });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al subir el PDF');
    } finally {
      setUploading(null);
    }
  };

  const subirActaDesdeArchivo = async (file: File) => {
    setUploading('acta');
    try {
      const up = await uploadPdf(file);
      mActa.mutate({ archivo_url: up.url, nombre_original: up.nombre_original });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al subir el PDF');
    } finally {
      setUploading(null);
    }
  };

  // ── Early returns AFTER all hooks ─────────────────────────────────
  if (Number.isNaN(postulacionId)) {
    return <p className="p-6">ID inválido</p>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !practica) {
    return (
      <div className="p-6 max-w-lg">
        <p className="text-muted-foreground mb-4">
          No hay expediente de práctica para esta postulación (debe estar aceptada).
        </p>
        <Button variant="outline" onClick={() => router.push('/mis-postulaciones')}>
          Volver
        </Button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => router.push('/mis-postulaciones')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Mis postulaciones
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Expediente de prácticas</CardTitle>
              <Badge variant="secondary">{estadoLabel}</Badge>
            </div>
            {practica.postulacion?.oferta && (
              <p className="text-sm text-muted-foreground">
                {practica.postulacion.oferta.titulo} —{' '}
                {practica.postulacion.oferta.empresa?.razon_social}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Horas:{' '}
              <strong>
                {practica.horas_cumplidas} / {practica.horas_totales}
              </strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Horas validadas por asesor (reportes mensuales):{' '}
              <strong>{totalHorasValidadas}</strong>
            </p>
            {practica.plan_practicas_url && (
              <p>
                Plan PDF:{' '}
                <a
                  href={practica.plan_practicas_url}
                  className="text-primary underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  ver enlace
                </a>{' '}
                {practica.plan_validado_en &&
                  `(validado ${formatDate(practica.plan_validado_en)})`}
              </p>
            )}
            {practica.informe_final_url && (
              <p>
                Informe final:{' '}
                <a
                  href={practica.informe_final_url}
                  className="text-primary underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  ver enlace
                </a>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Estado del flujo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Plan:</strong> {practica.plan_validado ? 'OK' : 'Pendiente'}
            </p>
            <p>
              <strong>Ejecución:</strong> reportes mensuales
            </p>
            <p>
              <strong>Informe final:</strong>{' '}
              {practica.informe_final_url ? 'Cargado' : 'Pendiente'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 1. Plan — estudiante carga; secretaría valida */}
      {practica.estado === 'plan_pendiente' && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">1. Plan de prácticas (PDF)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {esEstudiante && (
              <div className="space-y-3">
                <input
                  ref={planFileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) subirPlanDesdeArchivo(f);
                    e.target.value = '';
                  }}
                />
                <div className="space-y-2">
                  <Label>Subir plan (PDF en el servidor)</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={uploading === 'plan' || mPlan.isPending}
                    onClick={() => planFileRef.current?.click()}
                  >
                    {uploading === 'plan' || mPlan.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 mr-2" />
                        Elegir PDF
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">O pegar URL externa</Label>
                  <Input
                    value={planUrl}
                    onChange={(e) => setPlanUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!planUrl.trim() || mPlan.isPending}
                    onClick={() => mPlan.mutate({ archivo_url: planUrl.trim() })}
                  >
                    Registrar desde URL
                  </Button>
                </div>
              </div>
            )}
            {esSecretaria && practica.plan_practicas_url && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Validación administrativa (secretaría)</p>
                <Textarea
                  placeholder="Observaciones (opcional)"
                  value={planObs}
                  onChange={(e) => setPlanObs(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={() =>
                      mValidar.mutate({ aprobado: true, observaciones: planObs || undefined })
                    }
                    disabled={mValidar.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar OK — pasar a en ejecución
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      mValidar.mutate({
                        aprobado: false,
                        observaciones: planObs || 'Observado',
                      })
                    }
                    disabled={mValidar.isPending}
                  >
                    Observar plan
                  </Button>
                </div>
              </div>
            )}
            {!esEstudiante && !esSecretaria && (
              <p className="text-muted-foreground text-sm">
                Solo el estudiante o secretaría actúan en esta etapa.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ejecución: solicitar informe */}
      {(practica.estado === 'en_ejecucion' || practica.estado === 'plan_validado') &&
        esEstudiante && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Siguiente paso</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                onClick={() => mSolicitar.mutate()}
                disabled={mSolicitar.isPending}
              >
                Solicitar trámite de informe final
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Requiere horas mínimas cumplidas según reglamento.
              </p>
            </CardContent>
          </Card>
        )}

      {/* 2. Informe final y cierre */}
      {(practica.estado === 'informe_pendiente' || practica.estado === 'en_ejecucion') && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">2. Informe final y firma del asesor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(esEstudiante || esAsesorPractica) &&
              (practica.estado === 'en_ejecucion' ||
                practica.estado === 'informe_pendiente') && (
                <div className="space-y-3">
                  <input
                    ref={informeFileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) subirInformeDesdeArchivo(f);
                      e.target.value = '';
                    }}
                  />
                  <Label>Informe final (PDF)</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={uploading === 'informe' || mInforme.isPending}
                    onClick={() => informeFileRef.current?.click()}
                  >
                    {uploading === 'informe' || mInforme.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 mr-2" />
                        Subir PDF
                      </>
                    )}
                  </Button>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">O URL</Label>
                    <Input
                      value={informeUrl}
                      onChange={(e) => setInformeUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!informeUrl.trim() || mInforme.isPending}
                      onClick={() => mInforme.mutate({ archivo_url: informeUrl.trim() })}
                    >
                      Registrar desde URL
                    </Button>
                  </div>
                </div>
              )}
            {esAsesorPractica && practica.estado === 'informe_pendiente' && (
              <div className="space-y-4 border-t pt-4">
                <input
                  ref={actaFileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) subirActaDesdeArchivo(f);
                    e.target.value = '';
                  }}
                />
                <div className="space-y-2">
                  <Label>Acta de aprobación (PDF o URL)</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploading === 'acta' || mActa.isPending}
                    onClick={() => actaFileRef.current?.click()}
                  >
                    {uploading === 'acta' || mActa.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 mr-2" />
                        Subir acta PDF
                      </>
                    )}
                  </Button>
                  <Input
                    value={actaUrl}
                    onChange={(e) => setActaUrl(e.target.value)}
                    placeholder="https://... (opcional)"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!actaUrl.trim() || mActa.isPending}
                    onClick={() => mActa.mutate({ archivo_url: actaUrl.trim() })}
                  >
                    Registrar acta desde URL
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    value={informeObs}
                    onChange={(e) => setInformeObs(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  onClick={() => mAprobar.mutate()}
                  disabled={
                    mAprobar.isPending ||
                    (!practica.informe_final_url && !actaUrl.trim())
                  }
                >
                  Aprobar informe y cerrar práctica
                </Button>
              </div>
            )}
            {practica.estado === 'informe_pendiente' && !esAsesorPractica && (
              <p className="text-sm text-muted-foreground">
                Esperando acción del asesor de prácticas.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {practica.estado === 'aprobado' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <p className="font-medium text-green-900">
              Práctica aprobada. Puede continuar el flujo de tesis en el sistema.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reportes mensuales */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Reportes mensuales (ejecución)</CardTitle>
          <p className="text-sm text-muted-foreground">
            El estudiante registra horas por mes y adjunta un PDF. El asesor valida cada
            reporte; solo las horas validadas se contabilizan.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {esEstudiante && (
            <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Año</Label>
                  <Input
                    value={repAnio}
                    onChange={(e) => setRepAnio(e.target.value)}
                    type="number"
                    min={2000}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Mes (1-12)</Label>
                  <Input
                    value={repMes}
                    onChange={(e) => setRepMes(e.target.value)}
                    type="number"
                    min={1}
                    max={12}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Horas trabajadas</Label>
                  <Input
                    value={repHoras}
                    onChange={(e) => setRepHoras(e.target.value)}
                    type="number"
                    min={0}
                  />
                </div>
                <div className="space-y-1">
                  <Label>PDF</Label>
                  <input
                    ref={repFileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setRepUploading(true);
                      try {
                        const up = await uploadPdf(f);
                        const anio = parseInt(repAnio, 10);
                        const mes = parseInt(repMes, 10);
                        const horas = parseInt(repHoras, 10);
                        if (Number.isNaN(anio) || Number.isNaN(mes) || Number.isNaN(horas)) {
                          toast.error('Complete año/mes/horas');
                          return;
                        }
                        mReporteMensual.mutate({
                          anio,
                          mes,
                          horas_reportadas: horas,
                          archivo_url: up.url,
                          ...(repObs.trim() ? { observaciones: repObs.trim() } : {}),
                        });
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Error al subir PDF');
                      } finally {
                        setRepUploading(false);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={repUploading || mReporteMensual.isPending}
                    onClick={() => repFileRef.current?.click()}
                    className="w-full"
                  >
                    {repUploading || mReporteMensual.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 mr-2" />
                        Subir PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Observaciones del estudiante (opcional)</Label>
                <Textarea
                  value={repObs}
                  onChange={(e) => setRepObs(e.target.value)}
                  rows={2}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nota: si vuelve a enviar el mismo mes/año, el reporte se actualiza y queda
                nuevamente "pendiente de validación".
              </p>
            </div>
          )}

          {Array.isArray(reportesMensuales) && reportesMensuales.length > 0 ? (
            <div className="space-y-3">
              {reportesMensuales.map((r: any) => (
                <div key={r.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="text-sm">
                      <p className="font-medium">
                        {r.mes}/{r.anio} · {r.horas_reportadas} horas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.validado ? 'Validado por asesor' : 'Pendiente de validación'} ·{' '}
                        {r.created_at ? formatDate(r.created_at) : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.validado ? (
                        <Badge className="bg-green-100 text-green-900">Validado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                      {r.archivo_url && (
                        <a
                          href={r.archivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline text-sm"
                        >
                          ver PDF
                        </a>
                      )}
                    </div>
                  </div>
                  {r.observaciones && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Estudiante:</strong> {r.observaciones}
                    </p>
                  )}
                  {r.observaciones_asesor && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Asesor:</strong> {r.observaciones_asesor}
                    </p>
                  )}

                  {esAsesorPractica && (
                    <div className="pt-2 border-t space-y-2">
                      <Textarea
                        placeholder="Observación del asesor (opcional)"
                        rows={2}
                        value={repValidObs[r.id] ?? ''}
                        onChange={(e) =>
                          setRepValidObs((s) => ({ ...s, [r.id]: e.target.value }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          type="button"
                          disabled={mValidarReporte.isPending}
                          onClick={() =>
                            mValidarReporte.mutate({
                              reporteId: r.id,
                              validado: true,
                              observaciones: repValidObs[r.id] || undefined,
                            })
                          }
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Validar (contabiliza horas)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          disabled={mValidarReporte.isPending}
                          onClick={() =>
                            mValidarReporte.mutate({
                              reporteId: r.id,
                              validado: false,
                              observaciones: repValidObs[r.id] || 'Revisar reporte',
                            })
                          }
                        >
                          Observar / rechazar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay reportes mensuales.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
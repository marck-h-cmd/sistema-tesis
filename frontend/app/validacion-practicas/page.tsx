'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { practicasApi, seguimientoApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Loader2, ExternalLink, CheckCircle2, FileWarning, CalendarClock, FileUp } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { uploadPdf } from '@/lib/api/uploadPdf';

const docTipoLabel: Record<string, string> = {
  plan_practicas: 'Plan de prácticas',
  informe_final: 'Informe final',
  acta_aprobacion_asesor: 'Acta asesor',
  resolucion_facultad: 'Resolución facultad',
};

const MESES_ES = [
  '',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

function mesNombre(mes: number): string {
  return MESES_ES[mes] ?? `mes ${mes}`;
}

function apiErrorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function describeDocumentoPractica(doc: Record<string, unknown>): string {
  const tipoRaw = typeof doc.tipo === 'string' ? doc.tipo : '';
  const tipo = docTipoLabel[tipoRaw] || tipoRaw || 'Documento';
  const nombreOriginal =
    typeof doc.nombre_original === 'string' && doc.nombre_original.trim()
      ? doc.nombre_original.trim()
      : null;
  const subido =
    typeof doc.subido_en === 'string' ? formatDate(doc.subido_en as string) : null;
  const archivo =
    typeof doc.archivo_url === 'string' && doc.archivo_url
      ? 'Hay archivo cargado para revisión.'
      : 'Sin archivo.';
  const nomPart = nombreOriginal ? ` Nombre original: «${nombreOriginal}».` : '';
  const fechaPart = subido ? ` Subido el ${subido}.` : '';
  return `${tipo}: constancia en el expediente de prácticas profesionales.${nomPart}${fechaPart} ${archivo}`;
}

function describeReporteMensual(rep: Record<string, unknown>): string {
  const anio = typeof rep.anio === 'number' ? rep.anio : '—';
  const mesNum = typeof rep.mes === 'number' ? rep.mes : 0;
  const horas = typeof rep.horas_reportadas === 'number' ? rep.horas_reportadas : '—';
  const archivoUrl = typeof rep.archivo_url === 'string' && rep.archivo_url;
  const pdfPart = archivoUrl
    ? 'Adjunto: PDF mensual cargado por el estudiante.'
    : 'Aún sin PDF mensual cargado.';
  const obsEst =
    typeof rep.observaciones === 'string' && rep.observaciones.trim()
      ? ` Notas del estudiante: ${rep.observaciones.trim()}.`
      : '';
  const creado =
    typeof rep.created_at === 'string' ? formatDate(rep.created_at as string) : null;
  const crePart = creado ? ` Registrado en el sistema el ${creado}.` : '';
  return `Reporte mensual de ejecución (${mesNombre(mesNum)} ${anio}): horas declaradas para ese período.${crePart} El estudiante reporta ${horas} horas en el mes.${obsEst} ${pdfPart}`;
}

// ── Sección exclusiva para asesor: aprobar informe final ──────────────────────
function AsesorInformeCard({
  practica,
  onSuccess,
}: {
  practica: Record<string, unknown>;
  onSuccess: () => void;
}) {
  const [actaUrl, setActaUrl] = useState('');
  const [obs, setObs] = useState('');
  const [uploading, setUploading] = useState(false);
  const actaFileRef = useRef<HTMLInputElement>(null);

  const mAprobar = useMutation({
    mutationFn: (body: { acta_aprobacion_url?: string; observaciones?: string }) =>
      practicasApi.aprobarInforme(practica.id as number, body),
    onSuccess: () => {
      toast.success('Informe final aprobado — práctica cerrada');
      setActaUrl('');
      setObs('');
      onSuccess();
    },
    onError: (e: unknown) => toast.error(apiErrorMessage(e, 'Error al aprobar')),
  });

  const subirActa = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadPdf(file);
      setActaUrl(up.url);
      toast.success('Acta subida — confirma la aprobación');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al subir PDF');
    } finally {
      setUploading(false);
    }
  };

  const est = practica.estudiante as Record<string, unknown> | undefined;
  const u = est?.usuario as Record<string, unknown> | undefined;
  const nombre = u ? `${u.nombres} ${u.apellidos}` : '—';
  const postId = practica.postulacion_id as number;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <Badge variant="secondary">Informe final pendiente</Badge>
          <p className="font-medium mt-2">{nombre}</p>
          <p className="text-xs text-muted-foreground">Práctica #{String(practica.id)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {typeof practica.informe_final_url === 'string' && practica.informe_final_url && (
            <a
              href={practica.informe_final_url as string}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline inline-flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver informe PDF
            </a>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/practicas/expediente/${postId}`}>Expediente</Link>
          </Button>
        </div>
      </div>

      {/* Acta de aprobación */}
      <div className="space-y-2">
        <Label>Acta de aprobación (PDF)</Label>
        <input
          ref={actaFileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subirActa(f);
            e.target.value = '';
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => actaFileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <FileUp className="h-4 w-4 mr-2" />
                Subir acta PDF
              </>
            )}
          </Button>
          {actaUrl && (
            <a
              href={actaUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline inline-flex items-center"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver acta subida
            </a>
          )}
        </div>
        <Label className="text-muted-foreground text-xs">O pegar URL externa</Label>
        <Input
          value={actaUrl}
          onChange={(e) => setActaUrl(e.target.value)}
          placeholder="https://... (opcional)"
        />
      </div>

      <div className="space-y-1">
        <Label>Observaciones (opcional)</Label>
        <Textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          rows={2}
          placeholder="Comentarios para el expediente..."
        />
      </div>

      <Button
        disabled={mAprobar.isPending || (!practica.informe_final_url && !actaUrl.trim())}
        onClick={() =>
          mAprobar.mutate({
            acta_aprobacion_url: actaUrl.trim() || undefined,
            observaciones: obs.trim() || undefined,
          })
        }
      >
        {mAprobar.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        )}
        Aprobar informe y cerrar práctica
      </Button>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function SecretariaValidacionPracticasPage() {
  const { hasRole, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [obsByKey, setObsByKey] = useState<Record<string, string>>({});

  const esAsesor = hasRole('asesor');
  const esSecretariaOAdmin = hasRole('secretaria') || hasRole('admin');

  useEffect(() => {
    if (user && !esSecretariaOAdmin && !esAsesor) {
      router.replace('/dashboard');
    }
  }, [user, esSecretariaOAdmin, esAsesor, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['practicas-secretaria-cola'],
    queryFn: () => practicasApi.secretariaCola().then((r) => r.data.data),
    enabled: esSecretariaOAdmin || esAsesor,
  });

  const mValidarDoc = useMutation({
    mutationFn: (args: {
      practicaId: number;
      documentoId: number;
      validado: boolean;
      observaciones?: string;
    }) =>
      practicasApi.validarDocumento(args.practicaId, args.documentoId, {
        validado: args.validado,
        observaciones: args.observaciones,
      }),
    onSuccess: () => {
      toast.success('Documento actualizado');
      qc.invalidateQueries({ queryKey: ['practicas-secretaria-cola'] });
    },
    onError: (e: unknown) => toast.error(apiErrorMessage(e, 'Error')),
  });

  const mValidarRep = useMutation({
    mutationFn: (args: {
      practicaId: number;
      reporteId: number;
      validado: boolean;
      observaciones?: string;
    }) =>
      seguimientoApi.validarReporteMensual(args.practicaId, args.reporteId, {
        validado: args.validado,
        observaciones: args.observaciones,
      }),
    onSuccess: () => {
      toast.success('Reporte mensual actualizado');
      qc.invalidateQueries({ queryKey: ['practicas-secretaria-cola'] });
    },
    onError: (e: unknown) => toast.error(apiErrorMessage(e, 'Error')),
  });

  if (!user || (!esSecretariaOAdmin && !esAsesor)) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const planes = data?.planes_pendientes ?? [];
  const docs = data?.documentos_sin_validar ?? [];
  const reportes = data?.reportes_mensuales_sin_validar ?? [];
  // Prácticas con informe final cargado y pendientes de aprobación del asesor
  const informesPendientes: Record<string, unknown>[] =
    data?.informes_pendientes_asesor ?? [];

  // ── Vista asesor: solo aprobación de informes finales ─────────────────────
  if (esAsesor && !esSecretariaOAdmin) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Aprobación de informes finales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Informes finales de prácticas pendientes de tu firma de aprobación.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Informes pendientes de aprobación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {informesPendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay informes finales pendientes de aprobación.
              </p>
            ) : (
              informesPendientes.map((p) => (
                <AsesorInformeCard
                  key={String(p.id)}
                  practica={p}
                  onSuccess={() =>
                    qc.invalidateQueries({ queryKey: ['practicas-secretaria-cola'] })
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Vista secretaría / admin: cola completa ───────────────────────────────
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Validación de prácticas (secretaría)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Plan con PDF esperando revisión administrativa, documentos de expediente pendientes de
          marca de validación, y reportes mensuales de ejecución pendientes de validación
          (incluye el PDF mensual cuando el estudiante lo adjunta).
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileWarning className="h-5 w-5" />
            Planes pendientes de validación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {planes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay planes en cola.</p>
          ) : (
            planes.map((p: Record<string, unknown>) => {
              const est = p.estudiante as Record<string, unknown> | undefined;
              const u = est?.usuario as Record<string, unknown> | undefined;
              const nombre = `${(u?.nombres as string) ?? ''} ${(u?.apellidos as string) ?? ''}`.trim();
              const postId = p.postulacion_id as number;
              return (
                <div
                  key={String(p.id)}
                  className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-4"
                >
                  <div className="space-y-2 max-w-xl">
                    <p className="font-medium">{nombre}</p>
                    <p className="text-sm text-muted-foreground leading-snug">
                      Plan de prácticas en PDF: documento inicial del expediente, pendiente del
                      visto bueno de secretaría para pasar la práctica al estado de ejecución.
                      {typeof p.plan_practicas_subido_en === 'string' && (
                        <> Subido el {formatDate(p.plan_practicas_subido_en as string)}.</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Práctica #{String(p.id)} · Postulación #{postId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {typeof p.plan_practicas_url === 'string' && p.plan_practicas_url ? (
                      <a
                        href={p.plan_practicas_url as string}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm text-primary underline"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver PDF
                      </a>
                    ) : null}
                    <Button asChild size="sm">
                      <Link href={`/practicas/expediente/${postId}`}>
                        Abrir expediente — validar
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Documentos y reportes pendientes de validación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Documentos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Badge variant="outline">Documentos</Badge>
              <span className="text-sm text-muted-foreground">
                Actas, informes o trámites cargados como fila «documento práctica»
              </span>
            </div>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay documentos pendientes.</p>
            ) : (
              docs.map((d: Record<string, unknown>) => {
                const pr = d.practica as Record<string, unknown> | undefined;
                const est = pr?.estudiante as Record<string, unknown> | undefined;
                const u = est?.usuario as Record<string, unknown> | undefined;
                const nombre = u ? `${u.nombres} ${u.apellidos}` : '—';
                const tipo = docTipoLabel[(d.tipo as string) || ''] || (d.tipo as string);
                const docId = d.id as number;
                const key = `doc:${docId}`;
                const obs = obsByKey[key] ?? '';

                // Informe final → flujo de aprobación del asesor
                if (d.tipo === 'informe_final') {
                  // Construimos un objeto "practica-like" compatible con AsesorInformeCard
                  const practicaProxy: Record<string, unknown> = {
                    ...(pr ?? {}),
                    // El archivo del informe viene en el documento, no en la práctica
                    informe_final_url: d.archivo_url ?? pr?.informe_final_url,
                    postulacion_id: pr?.postulacion_id,
                    estudiante: pr?.estudiante,
                  };
                  return (
                    <AsesorInformeCard
                      key={key}
                      practica={practicaProxy}
                      onSuccess={() =>
                        qc.invalidateQueries({ queryKey: ['practicas-secretaria-cola'] })
                      }
                    />
                  );
                }

                // Resto de documentos → validación estándar
                return (
                  <div key={key} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <Badge variant="secondary">{tipo}</Badge>
                        <p className="font-medium mt-2">{nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Documento práctica #{docId}
                        </p>
                        <p className="text-sm text-muted-foreground mt-3 leading-snug">
                          {describeDocumentoPractica(d)}
                        </p>
                      </div>
                      {typeof d.archivo_url === 'string' && d.archivo_url ? (
                        <a
                          href={d.archivo_url as string}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline inline-flex items-center h-fit"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver archivo
                        </a>
                      ) : null}
                    </div>
                    <Textarea
                      placeholder="Observaciones (opcional)"
                      value={obs}
                      onChange={(e) => setObsByKey((s) => ({ ...s, [key]: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={mValidarDoc.isPending}
                        onClick={() =>
                          mValidarDoc.mutate({
                            practicaId: d.practica_id as number,
                            documentoId: docId,
                            validado: true,
                            observaciones: obs || undefined,
                          })
                        }
                      >
                        Marcar validado
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mValidarDoc.isPending}
                        onClick={() =>
                          mValidarDoc.mutate({
                            practicaId: d.practica_id as number,
                            documentoId: docId,
                            validado: false,
                            observaciones: obs || 'Revisar documento',
                          })
                        }
                      >
                        Rechazar / observar
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/practicas/expediente/${pr?.postulacion_id as number}`}>
                          Expediente
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Reportes mensuales */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <Badge variant="outline">Reportes mensuales</Badge>
              <span className="text-sm text-muted-foreground">
                Seguimiento de horas mensuales; validación habilitada para secretaría y
                administración
              </span>
            </div>
            {reportes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay reportes mensuales pendientes.
              </p>
            ) : (
              reportes.map((rep: Record<string, unknown>) => {
                const pr = rep.practica as Record<string, unknown> | undefined;
                const est = pr?.estudiante as Record<string, unknown> | undefined;
                const u = est?.usuario as Record<string, unknown> | undefined;
                const nombre = u ? `${u.nombres} ${u.apellidos}` : '—';
                const repId = rep.id as number;
                const practicaId = rep.practica_id as number;
                const key = `rep:${repId}`;
                const obs = obsByKey[key] ?? '';
                const anio = rep.anio as number;
                const mesNum = rep.mes as number;
                const etiquetaPeriodo = `${mesNombre(mesNum)} ${anio}`;

                return (
                  <div key={key} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <Badge variant="secondary">
                          Reporte mensual · {etiquetaPeriodo}
                        </Badge>
                        <p className="font-medium mt-2">{nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Reporte #{repId} · Práctica #{practicaId}
                        </p>
                        <p className="text-sm text-muted-foreground mt-3 leading-snug">
                          {describeReporteMensual(rep)}
                        </p>
                      </div>
                      {typeof rep.archivo_url === 'string' && rep.archivo_url ? (
                        <a
                          href={rep.archivo_url as string}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline inline-flex items-center h-fit"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver PDF
                        </a>
                      ) : null}
                    </div>
                    <Textarea
                      placeholder="Observaciones al asesor/estudiante (opcional)"
                      value={obs}
                      onChange={(e) => setObsByKey((s) => ({ ...s, [key]: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={mValidarRep.isPending}
                        onClick={() =>
                          mValidarRep.mutate({
                            practicaId,
                            reporteId: repId,
                            validado: true,
                            observaciones: obs || undefined,
                          })
                        }
                      >
                        Marcar válido (horas mes)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mValidarRep.isPending}
                        onClick={() =>
                          mValidarRep.mutate({
                            practicaId,
                            reporteId: repId,
                            validado: false,
                            observaciones: obs || 'Revisar reporte mensual',
                          })
                        }
                      >
                        Observar / no validar
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/practicas/expediente/${pr?.postulacion_id as number}`}>
                          Expediente
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
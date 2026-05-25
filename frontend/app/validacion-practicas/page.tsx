"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { practicasApi, seguimientoApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  FileWarning,
  CalendarClock,
  FileUp,
  User,
  Briefcase,
  AlertCircle,
  FileText,
  XCircle,
  Calendar,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import { useRouter } from "next/navigation";
import { uploadPdf } from "@/lib/api/uploadPdf";

const docTipoLabel: Record<string, string> = {
  plan_practicas: "Plan de prácticas",
  informe_final: "Informe final",
  acta_aprobacion_asesor: "Acta asesor",
  resolucion_facultad: "Resolución facultad",
};

const MESES_ES = [
  "",
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

function mesNombre(mes: number): string {
  return MESES_ES[mes] ?? `mes ${mes}`;
}

function apiErrorMessage(e: unknown, fallback: string): string {
  if (typeof e === "object" && e !== null && "response" in e) {
    const msg = (e as { response?: { data?: { message?: string } } }).response
      ?.data?.message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

function describeDocumentoPractica(doc: Record<string, unknown>): string {
  const tipoRaw = typeof doc.tipo === "string" ? doc.tipo : "";
  const tipo = docTipoLabel[tipoRaw] || tipoRaw || "Documento";
  const nombreOriginal =
    typeof doc.nombre_original === "string" && doc.nombre_original.trim()
      ? doc.nombre_original.trim()
      : null;
  const subido =
    typeof doc.subido_en === "string"
      ? formatDate(doc.subido_en as string)
      : null;
  const archivo =
    typeof doc.archivo_url === "string" && doc.archivo_url
      ? "Hay archivo cargado para revisión."
      : "Sin archivo.";
  const nomPart = nombreOriginal
    ? ` Nombre original: «${nombreOriginal}».`
    : "";
  const fechaPart = subido ? ` Subido el ${subido}.` : "";
  return `${tipo}: constancia en el expediente de prácticas profesionales.${nomPart}${fechaPart} ${archivo}`;
}

function describeReporteMensual(rep: Record<string, unknown>): string {
  const anio = typeof rep.anio === "number" ? rep.anio : "—";
  const mesNum = typeof rep.mes === "number" ? rep.mes : 0;
  const horas =
    typeof rep.horas_reportadas === "number" ? rep.horas_reportadas : "—";
  const archivoUrl = typeof rep.archivo_url === "string" && rep.archivo_url;
  const pdfPart = archivoUrl
    ? "Adjunto: PDF mensual cargado por el estudiante."
    : "Aún sin PDF mensual cargado.";
  const obsEst =
    typeof rep.observaciones === "string" && rep.observaciones.trim()
      ? ` Notas del estudiante: ${rep.observaciones.trim()}.`
      : "";
  const creado =
    typeof rep.created_at === "string"
      ? formatDate(rep.created_at as string)
      : null;
  const crePart = creado ? ` Registrado en el sistema el ${creado}.` : "";
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
  const [actaUrl, setActaUrl] = useState("");
  const [obs, setObs] = useState("");
  const [uploading, setUploading] = useState(false);
  const actaFileRef = useRef<HTMLInputElement>(null);

  const mAprobar = useMutation({
    mutationFn: (body: {
      acta_aprobacion_url?: string;
      observaciones?: string;
    }) => practicasApi.aprobarInforme(practica.id as number, body),
    onSuccess: () => {
      toast.success("Informe final aprobado — práctica cerrada");
      setActaUrl("");
      setObs("");
      onSuccess();
    },
    onError: (e: unknown) =>
      toast.error(apiErrorMessage(e, "Error al aprobar")),
  });

  const subirActa = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadPdf(file);
      setActaUrl(up.url);
      toast.success("Acta subida — confirma la aprobación");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Error al subir PDF");
    } finally {
      setUploading(false);
    }
  };

  const est = practica.estudiante as Record<string, unknown> | undefined;
  const u = est?.usuario as Record<string, unknown> | undefined;
  const nombre = u ? `${u.nombres} ${u.apellidos}` : "—";
  const postId = practica.postulacion_id as number;

  return (
    <div className="flex flex-col lg:flex-row gap-6 border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0"
          >
            Informe final pendiente de firma
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto font-medium">
            Práctica #{String(practica.id)}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-muted-foreground" />
            {nombre}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {typeof practica.informe_final_url === "string" &&
            practica.informe_final_url && (
              <a
                href={practica.informe_final_url as string}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary/80 hover:underline font-medium inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" />
                Ver Informe PDF
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full lg:w-[380px] lg:border-l lg:pl-6 bg-muted/10 p-4 lg:p-0 rounded-lg lg:rounded-none">
        <div className="hidden lg:flex justify-end mb-1">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full shadow-sm"
          >
            <Link href={`/practicas/expediente/${postId}`}>
              <Briefcase className="h-4 w-4 mr-2" />
              Ver Expediente
            </Link>
          </Button>
        </div>

        {/* Acta de aprobación */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Acta de aprobación (Requerido)
          </Label>
          <input
            ref={actaFileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirActa(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={uploading}
              onClick={() => actaFileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileUp className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Subiendo..." : "Subir acta PDF"}
            </Button>
          </div>
          {actaUrl && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 mt-2 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              Acta lista para firmar
            </div>
          )}

          <div className="pt-2">
            <Label className="text-muted-foreground text-xs">
              O pegar URL externa (alternativo)
            </Label>
            <Input
              value={actaUrl}
              onChange={(e) => setActaUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-semibold">Observaciones</Label>
          <Textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={2}
            placeholder="Comentarios para el expediente..."
            className="resize-none h-16 text-sm"
          />
        </div>

        <Button
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={
            mAprobar.isPending ||
            (!practica.informe_final_url && !actaUrl.trim())
          }
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
          Aprobar informe y cerrar
        </Button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function SecretariaValidacionPracticasPage() {
  const { hasRole, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [obsByKey, setObsByKey] = useState<Record<string, string>>({});

  const esAsesor = hasRole("asesor");
  const esSecretariaOAdmin = hasRole("secretaria") || hasRole("admin");
  const colaQueryKey = esAsesor && !esSecretariaOAdmin ? ["practicas-asesor-cola"] : ["practicas-secretaria-cola"];

  useEffect(() => {
    if (user && !esSecretariaOAdmin && !esAsesor) {
      router.replace("/dashboard");
    }
  }, [user, esSecretariaOAdmin, esAsesor, router]);

  const { data, isLoading } = useQuery({
    queryKey: colaQueryKey,
    queryFn: () =>
      (esAsesor && !esSecretariaOAdmin
        ? practicasApi.asesorCola()
        : practicasApi.secretariaCola()
      ).then((r) => r.data.data),
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
      toast.success("Documento actualizado");
      qc.invalidateQueries({ queryKey: colaQueryKey });
    },
    onError: (e: unknown) => toast.error(apiErrorMessage(e, "Error")),
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
      toast.success("Reporte mensual actualizado");
      qc.invalidateQueries({ queryKey: colaQueryKey });
    },
    onError: (e: unknown) => toast.error(apiErrorMessage(e, "Error")),
  });

  if (!user || (!esSecretariaOAdmin && !esAsesor)) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Cargando datos...</p>
        </div>
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
      <div className="container max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Validación de Prácticas (Asesor)
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Reportes mensuales y cierre de informe final solo de tus prácticas asignadas.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Reportes mensuales pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {reportes.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-lg bg-muted/20 border border-dashed">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No hay reportes mensuales pendientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reportes.map((rep: Record<string, unknown>) => {
                    const pr = rep.practica as
                      | Record<string, unknown>
                      | undefined;
                    const est = pr?.estudiante as
                      | Record<string, unknown>
                      | undefined;
                    const u = est?.usuario as Record<string, unknown> | undefined;
                    const nombre = u ? `${u.nombres} ${u.apellidos}` : "—";
                    const repId = rep.id as number;
                    const practicaId = rep.practica_id as number;
                    const key = `rep:${repId}`;
                    const obs = obsByKey[key] ?? "";
                    const anio = rep.anio as number;
                    const mesNum = rep.mes as number;
                    const etiquetaPeriodo = `${mesNombre(mesNum)} ${anio}`;

                    return (
                      <div
                        key={key}
                        className="flex flex-col lg:flex-row gap-6 border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 capitalize"
                            >
                              Mes: {etiquetaPeriodo}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto font-medium">
                              Rep #{repId} · Práctica #{practicaId}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {nombre}
                            </h3>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground leading-relaxed">
                            <CalendarClock className="h-4 w-4 inline mr-1.5 mb-0.5 text-primary/60" />
                            {describeReporteMensual(rep)}
                          </div>

                          {typeof rep.archivo_url === "string" &&
                            rep.archivo_url && (
                              <div className="pt-2">
                                <a
                                  href={rep.archivo_url as string}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:text-primary/80 hover:underline font-medium inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                                >
                                  <FileText className="h-4 w-4" />
                                  Ver PDF del Reporte
                                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                                </a>
                              </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 w-full lg:w-[320px] lg:border-l lg:pl-6">
                          <div className="hidden lg:flex justify-end mb-1">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="w-full shadow-sm"
                            >
                              <Link
                                href={`/practicas/expediente/${pr?.postulacion_id as number}`}
                              >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Ver Expediente
                              </Link>
                            </Button>
                          </div>

                          <div className="space-y-1 mt-auto">
                            <label className="text-xs font-medium text-muted-foreground">
                              Observaciones (opcional)
                            </label>
                            <Textarea
                              placeholder="Nota al estudiante..."
                              value={obs}
                              onChange={(e) =>
                                setObsByKey((s) => ({
                                  ...s,
                                  [key]: e.target.value,
                                }))
                              }
                              className="resize-none h-20 text-sm focus-visible:ring-primary/50"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Validar Horas
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full shadow-sm"
                              disabled={mValidarRep.isPending}
                              onClick={() =>
                                mValidarRep.mutate({
                                  practicaId,
                                  reporteId: repId,
                                  validado: false,
                                  observaciones: obs || "Revisar reporte mensual",
                                })
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              Observar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-primary" />
                Documentos (informe final) sin validar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {docs.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-lg bg-muted/20 border border-dashed">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No hay documentos pendientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {docs.map((d: Record<string, unknown>) => {
                    const pr = d.practica as Record<string, unknown> | undefined;
                    const est = pr?.estudiante as Record<string, unknown> | undefined;
                    const u = est?.usuario as Record<string, unknown> | undefined;
                    const nombre =
                      u ? `${u.nombres} ${u.apellidos}` : "—";
                    const docId = d.id as number;
                    const key = `doc:${docId}`;
                    const obs = obsByKey[key] ?? "";

                    return (
                      <div
                        key={key}
                        className="flex flex-col lg:flex-row gap-6 border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            >
                              {docTipoLabel[String(d.tipo)] || String(d.tipo)}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto font-medium">
                              Doc #{docId} · Práctica #{String(d.practica_id)}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {nombre}
                            </h3>
                          </div>

                          <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground leading-relaxed">
                            <AlertCircle className="h-4 w-4 inline mr-1.5 mb-0.5 text-primary/60" />
                            {describeDocumentoPractica(d)}
                          </div>

                          {typeof d.archivo_url === "string" && d.archivo_url && (
                            <div className="pt-2">
                              <a
                                href={d.archivo_url as string}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:text-primary/80 hover:underline font-medium inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                              >
                                <FileText className="h-4 w-4" />
                                Ver Archivo Adjunto
                                <ExternalLink className="h-3.5 w-3.5 ml-1" />
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 w-full lg:w-[320px] lg:border-l lg:pl-6">
                          <div className="hidden lg:flex justify-end mb-1">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="w-full shadow-sm"
                            >
                              <Link
                                href={`/practicas/expediente/${pr?.postulacion_id as number}`}
                              >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Ver Expediente
                              </Link>
                            </Button>
                          </div>

                          <div className="space-y-1 mt-auto">
                            <label className="text-xs font-medium text-muted-foreground">
                              Observaciones (opcional)
                            </label>
                            <Textarea
                              placeholder="Nota al estudiante..."
                              value={obs}
                              onChange={(e) =>
                                setObsByKey((s) => ({
                                  ...s,
                                  [key]: e.target.value,
                                }))
                              }
                              className="resize-none h-20 text-sm focus-visible:ring-primary/50"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Válido
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full shadow-sm"
                              disabled={mValidarDoc.isPending}
                              onClick={() =>
                                mValidarDoc.mutate({
                                  practicaId: d.practica_id as number,
                                  documentoId: docId,
                                  validado: false,
                                  observaciones: obs || "Revisar documento",
                                })
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              Observar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Informes finales pendientes de aprobación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {informesPendientes.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-lg bg-muted/20 border border-dashed">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    No hay informes finales pendientes de aprobación en este
                    momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {informesPendientes.map((p) => (
                    <AsesorInformeCard
                      key={String(p.id)}
                      practica={p}
                      onSuccess={() =>
                        qc.invalidateQueries({
                          queryKey: colaQueryKey,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Vista secretaría / admin: cola completa ───────────────────────────────
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Validación de Prácticas (Secretaría)
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Plan con PDF esperando revisión administrativa, documentos de
          expediente pendientes de marca de validación, y reportes mensuales de
          ejecución pendientes de validación.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-amber-500/10 border-b border-amber-500/20">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-500">
            <FileWarning className="h-5 w-5" />
            Planes de Práctica Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {planes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay planes en cola.
            </p>
          ) : (
            <div className="space-y-4">
              {planes.map((p: Record<string, unknown>) => {
                const est = p.estudiante as Record<string, unknown> | undefined;
                const u = est?.usuario as Record<string, unknown> | undefined;
                const nombre =
                  `${(u?.nombres as string) ?? ""} ${(u?.apellidos as string) ?? ""}`.trim();
                const postId = p.postulacion_id as number;
                return (
                  <div
                    key={String(p.id)}
                    className="flex flex-col lg:flex-row gap-6 border border-amber-200/50 rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                        >
                          Plan de Prácticas
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto font-medium">
                          Práctica #{String(p.id)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {nombre}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                          <Briefcase className="h-4 w-4 shrink-0" />
                          Postulación #{postId}
                        </p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground">
                        Documento inicial del expediente, pendiente de revisión
                        administrativa.
                        {typeof p.plan_practicas_subido_en === "string" && (
                          <span className="block mt-1 font-medium text-foreground/80 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Subido el{" "}
                            {formatDate(p.plan_practicas_subido_en as string)}.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full lg:w-[280px] lg:border-l lg:pl-6 justify-center">
                      {typeof p.plan_practicas_url === "string" &&
                      p.plan_practicas_url ? (
                        <Button
                          variant="outline"
                          asChild
                          className="w-full justify-start shadow-sm"
                        >
                          <a
                            href={p.plan_practicas_url as string}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            Ver PDF Adjunto
                            <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        className="w-full justify-start bg-primary text-primary-foreground shadow-sm"
                      >
                        <Link href={`/practicas/expediente/${postId}`}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Abrir Expediente y Validar
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Documentos y Reportes Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-10">
          {/* Documentos */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Documentos</h3>
              </div>
              <span className="text-sm text-muted-foreground sm:ml-auto">
                Actas, informes o trámites del expediente
              </span>
            </div>

            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">
                No hay documentos pendientes de validación.
              </p>
            ) : (
              <div className="space-y-6">
                {docs.map((d: Record<string, unknown>) => {
                  const pr = d.practica as Record<string, unknown> | undefined;
                  const est = pr?.estudiante as
                    | Record<string, unknown>
                    | undefined;
                  const u = est?.usuario as Record<string, unknown> | undefined;
                  const nombre = u ? `${u.nombres} ${u.apellidos}` : "—";
                  const tipo =
                    docTipoLabel[(d.tipo as string) || ""] ||
                    (d.tipo as string);
                  const docId = d.id as number;
                  const key = `doc:${docId}`;
                  const obs = obsByKey[key] ?? "";

                  if (d.tipo === "informe_final") {
                    const practicaProxy: Record<string, unknown> = {
                      ...(pr ?? {}),
                      informe_final_url: d.archivo_url ?? pr?.informe_final_url,
                      postulacion_id: pr?.postulacion_id,
                      estudiante: pr?.estudiante,
                    };
                    return (
                      <AsesorInformeCard
                        key={key}
                        practica={practicaProxy}
                        onSuccess={() =>
                          qc.invalidateQueries({
                            queryKey: ["practicas-secretaria-cola"],
                          })
                        }
                      />
                    );
                  }

                  return (
                    <div
                      key={key}
                      className="flex flex-col lg:flex-row gap-6 border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground capitalize border-0"
                          >
                            {tipo}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto font-medium">
                            Doc #{docId}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {nombre}
                          </h3>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground leading-relaxed">
                          <FileText className="h-4 w-4 inline mr-1.5 mb-0.5 text-primary/60" />
                          {describeDocumentoPractica(d)}
                        </div>

                        {typeof d.archivo_url === "string" && d.archivo_url && (
                          <div className="pt-2">
                            <a
                              href={d.archivo_url as string}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:text-primary/80 hover:underline font-medium inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                            >
                              <FileText className="h-4 w-4" />
                              Ver Archivo Adjunto
                              <ExternalLink className="h-3.5 w-3.5 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 w-full lg:w-[320px] lg:border-l lg:pl-6">
                        <div className="hidden lg:flex justify-end mb-1">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full shadow-sm"
                          >
                            <Link
                              href={`/practicas/expediente/${pr?.postulacion_id as number}`}
                            >
                              <Briefcase className="h-4 w-4 mr-2" />
                              Ver Expediente
                            </Link>
                          </Button>
                        </div>

                        <div className="space-y-1 mt-auto">
                          <label className="text-xs font-medium text-muted-foreground">
                            Observaciones (opcional)
                          </label>
                          <Textarea
                            placeholder="Nota al estudiante si se observa..."
                            value={obs}
                            onChange={(e) =>
                              setObsByKey((s) => ({
                                ...s,
                                [key]: e.target.value,
                              }))
                            }
                            className="resize-none h-20 text-sm focus-visible:ring-primary/50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Válido
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full shadow-sm"
                            disabled={mValidarDoc.isPending}
                            onClick={() =>
                              mValidarDoc.mutate({
                                practicaId: d.practica_id as number,
                                documentoId: docId,
                                validado: false,
                                observaciones: obs || "Revisar documento",
                              })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Observar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reportes mensuales */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Reportes Mensuales</h3>
              </div>
              <span className="text-sm text-muted-foreground sm:ml-auto">
                Seguimiento de horas mensuales para validación
              </span>
            </div>

            {reportes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-lg border border-dashed">
                No hay reportes mensuales pendientes.
              </p>
            ) : (
              <div className="space-y-6">
                {reportes.map((rep: Record<string, unknown>) => {
                  const pr = rep.practica as
                    | Record<string, unknown>
                    | undefined;
                  const est = pr?.estudiante as
                    | Record<string, unknown>
                    | undefined;
                  const u = est?.usuario as Record<string, unknown> | undefined;
                  const nombre = u ? `${u.nombres} ${u.apellidos}` : "—";
                  const repId = rep.id as number;
                  const practicaId = rep.practica_id as number;
                  const key = `rep:${repId}`;
                  const obs = obsByKey[key] ?? "";
                  const anio = rep.anio as number;
                  const mesNum = rep.mes as number;
                  const etiquetaPeriodo = `${mesNombre(mesNum)} ${anio}`;

                  return (
                    <div
                      key={key}
                      className="flex flex-col lg:flex-row gap-6 border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 capitalize"
                          >
                            Mes: {etiquetaPeriodo}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto font-medium">
                            Rep #{repId} · Práctica #{practicaId}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {nombre}
                          </h3>
                        </div>

                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground leading-relaxed">
                          <CalendarClock className="h-4 w-4 inline mr-1.5 mb-0.5 text-primary/60" />
                          {describeReporteMensual(rep)}
                        </div>

                        {typeof rep.archivo_url === "string" &&
                          rep.archivo_url && (
                            <div className="pt-2">
                              <a
                                href={rep.archivo_url as string}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:text-primary/80 hover:underline font-medium inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                              >
                                <FileText className="h-4 w-4" />
                                Ver PDF del Reporte
                                <ExternalLink className="h-3.5 w-3.5 ml-1" />
                              </a>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col gap-3 w-full lg:w-[320px] lg:border-l lg:pl-6">
                        <div className="hidden lg:flex justify-end mb-1">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full shadow-sm"
                          >
                            <Link
                              href={`/practicas/expediente/${pr?.postulacion_id as number}`}
                            >
                              <Briefcase className="h-4 w-4 mr-2" />
                              Ver Expediente
                            </Link>
                          </Button>
                        </div>

                        <div className="space-y-1 mt-auto">
                          <label className="text-xs font-medium text-muted-foreground">
                            Observaciones (opcional)
                          </label>
                          <Textarea
                            placeholder="Nota al estudiante/asesor..."
                            value={obs}
                            onChange={(e) =>
                              setObsByKey((s) => ({
                                ...s,
                                [key]: e.target.value,
                              }))
                            }
                            className="resize-none h-20 text-sm focus-visible:ring-primary/50"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
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
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Validar Horas
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full shadow-sm"
                            disabled={mValidarRep.isPending}
                            onClick={() =>
                              mValidarRep.mutate({
                                practicaId,
                                reporteId: repId,
                                validado: false,
                                observaciones: obs || "Revisar reporte mensual",
                              })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Observar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { tesisApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  ExternalLink,
  Receipt,
  FileText,
  User,
  BookOpen,
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";

export default function SecretariaGestionPagosPage() {
  const { hasRole, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const puede =
    hasRole("secretaria") || hasRole("admin") || hasRole("coordinador");

  const [obsPago, setObsPago] = useState<Record<number, string>>({});
  const [obsDoc, setObsDoc] = useState<Record<number, string>>({});

  useEffect(() => {
    if (user && !puede) router.replace("/dashboard");
  }, [user, puede, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["tesis-secretaria-cola-validacion"],
    queryFn: () => tesisApi.secretariaColaValidacion().then((r) => r.data.data),
    enabled: !!user && puede,
  });

  const mVerificarPago = useMutation({
    mutationFn: (args: {
      tesisId: number;
      pagoId: number;
      estado: string;
      observaciones?: string;
    }) =>
      tesisApi.verificarPago(args.tesisId, args.pagoId, {
        estado: args.estado,
        observaciones: args.observaciones,
      }),
    onSuccess: () => {
      toast.success("Pago actualizado");
      qc.invalidateQueries({ queryKey: ["tesis-secretaria-cola-validacion"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error"),
  });

  const mValidarDoc = useMutation({
    mutationFn: (args: {
      tesisId: number;
      documentoId: number;
      validado: boolean;
      observaciones?: string;
    }) =>
      tesisApi.validarDocumentoTesis(args.tesisId, args.documentoId, {
        validado: args.validado,
        observaciones: args.observaciones,
      }),
    onSuccess: () => {
      toast.success("Documento actualizado");
      qc.invalidateQueries({ queryKey: ["tesis-secretaria-cola-validacion"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Error"),
  });

  if (!user || !puede) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const pagos = data.pagos_atencion ?? [];
  const docs = data.documentos_sin_validar ?? [];

  const nombreEst = (tesis: any) =>
    `${tesis?.estudiante?.usuario?.nombres ?? ""} ${tesis?.estudiante?.usuario?.apellidos ?? ""}`.trim();

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Gestión de Pagos y Documentos
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Valide comprobantes de pago pendientes y documentos de tesis que aún
          no están marcados como válidos administrativamente.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pagos en Atención
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {pagos.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-lg bg-muted/20 border border-dashed">
              <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                No hay pagos pendientes o con comprobante por revisar en este
                momento.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pagos.map((p: any) => (
                <div
                  key={p.id}
                  className="flex flex-col lg:flex-row gap-6 border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Info Izquierda */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="bg-primary/10 text-primary hover:bg-primary/20 capitalize border-0"
                      >
                        {String(p.tipo).replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant={
                          p.estado === "pendiente"
                            ? "secondary"
                            : p.estado === "rechazado"
                              ? "destructive"
                              : "default"
                        }
                      >
                        {p.estado}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto font-medium">
                        ID: {p.id}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {nombreEst(p.tesis)}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span className="truncate">{p.tesis?.titulo}</span>
                        <span className="text-xs opacity-50 shrink-0">
                          (#{p.tesis?.id})
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <CircleDollarSign className="h-4 w-4 text-primary" />
                        S/ {p.monto}
                      </span>
                      <div className="w-px h-4 bg-border hidden sm:block"></div>
                      {p.comprobante_url ? (
                        <a
                          href={p.comprobante_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver comprobante adjunto
                        </a>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1.5 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          Esperando comprobante del estudiante
                        </span>
                      )}
                    </div>

                    {p.observaciones && (
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mt-2 border border-destructive/20">
                        <span className="font-semibold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Observaciones
                          previas:
                        </span>
                        <p className="mt-1 ml-4">{p.observaciones}</p>
                      </div>
                    )}
                  </div>

                  {/* Acciones Derecha */}
                  <div className="flex flex-col gap-3 w-full lg:w-[320px] lg:border-l lg:pl-6">
                    <div className="flex justify-between items-center lg:hidden border-b pb-3 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Acciones
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tesis/${p.tesis_id}`}>Ficha Tesis</Link>
                      </Button>
                    </div>

                    <div className="hidden lg:flex justify-end mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full shadow-sm"
                      >
                        <Link href={`/tesis/${p.tesis_id}`}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ver Ficha de Tesis
                        </Link>
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Nota / Observación
                      </label>
                      <Textarea
                        placeholder="Motivo de rechazo o nota interna..."
                        value={obsPago[p.id] ?? ""}
                        onChange={(e) =>
                          setObsPago((s) => ({ ...s, [p.id]: e.target.value }))
                        }
                        className="resize-none h-20 text-sm focus-visible:ring-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        disabled={
                          mVerificarPago.isPending ||
                          (p.estado === "pendiente" && !p.comprobante_url)
                        }
                        onClick={() =>
                          mVerificarPago.mutate({
                            tesisId: p.tesis_id,
                            pagoId: p.id,
                            estado: "verificado",
                            observaciones: obsPago[p.id] || undefined,
                          })
                        }
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full shadow-sm"
                        disabled={
                          mVerificarPago.isPending ||
                          (p.estado === "pendiente" && !p.comprobante_url)
                        }
                        onClick={() =>
                          mVerificarPago.mutate({
                            tesisId: p.tesis_id,
                            pagoId: p.id,
                            estado: "rechazado",
                            observaciones:
                              obsPago[p.id] || "Revisar comprobante y datos.",
                          })
                        }
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentos de Tesis Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {docs.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-lg bg-muted/20 border border-dashed">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                No hay documentos sin marcar como validados en este momento.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {docs.map((d: any) => (
                <div
                  key={d.id}
                  className="flex flex-col lg:flex-row gap-6 border rounded-xl p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Info Izquierda */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 capitalize border-0"
                      >
                        {String(d.tipo).replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-muted text-muted-foreground"
                      >
                        v{d.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(d.subido_en)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {nombreEst(d.tesis)}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
                        <BookOpen className="h-4 w-4 shrink-0" />
                        <span className="truncate max-w-xl">
                          {d.tesis?.titulo}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center mt-2">
                      <a
                        href={d.archivo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:text-primary/80 hover:underline font-medium inline-flex items-center gap-2 text-sm bg-primary/10 px-4 py-2 rounded-lg transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        Abrir Documento Adjunto
                        <ExternalLink className="h-3.5 w-3.5 ml-1" />
                      </a>
                    </div>
                  </div>

                  {/* Acciones Derecha */}
                  <div className="flex flex-col gap-3 w-full lg:w-[320px] lg:border-l lg:pl-6">
                    <div className="flex justify-between items-center lg:hidden border-b pb-3 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Acciones
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tesis/${d.tesis_id}`}>Ficha Tesis</Link>
                      </Button>
                    </div>

                    <div className="hidden lg:flex justify-end mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full shadow-sm"
                      >
                        <Link href={`/tesis/${d.tesis_id}`}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ver Ficha de Tesis
                        </Link>
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Observaciones (opcional)
                      </label>
                      <Textarea
                        placeholder="Nota al estudiante si se observa..."
                        value={obsDoc[d.id] ?? ""}
                        onChange={(e) =>
                          setObsDoc((s) => ({ ...s, [d.id]: e.target.value }))
                        }
                        className="resize-none h-20 text-sm focus-visible:ring-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        disabled={mValidarDoc.isPending}
                        onClick={() =>
                          mValidarDoc.mutate({
                            tesisId: d.tesis_id,
                            documentoId: d.id,
                            validado: true,
                            observaciones: obsDoc[d.id] || undefined,
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
                            tesisId: d.tesis_id,
                            documentoId: d.id,
                            validado: false,
                            observaciones:
                              obsDoc[d.id] ||
                              "Revisar documento para proceder.",
                          })
                        }
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Observar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { estudiantesApi, tesisApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ExternalLink,
  CircleDollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

const estadosTesis: Record<string, { color: string; label: string }> = {
  propuesta: { color: 'bg-blue-50 text-blue-700 border-blue-200/80', label: 'Propuesta' },
  desarrollo: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200/80', label: 'En desarrollo' },
  en_revision: { color: 'bg-amber-50 text-amber-800 border-amber-200/80', label: 'En revisión (jurado)' },
  observaciones_emitidas: { color: 'bg-orange-50 text-orange-800 border-orange-200/80', label: 'Observaciones' },
  observaciones_levantadas: { color: 'bg-cyan-50 text-cyan-800 border-cyan-200/80', label: 'Correcciones cargadas' },
  aprobado_jurado: { color: 'bg-indigo-50 text-indigo-800 border-indigo-200/80', label: 'Aprobado por jurado' },
  expedito: { color: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', label: 'Expedito' },
  sustentacion_programada: { color: 'bg-purple-50 text-purple-800 border-purple-200/80', label: 'Sustentación programada' },
  sustentado: { color: 'bg-violet-50 text-violet-800 border-violet-200/80', label: 'Sustentado' },
  culminado: { color: 'bg-green-50 text-green-800 border-green-200/80', label: 'Culminado' },
};

const labelPagoTipo: Record<string, string> = {
  turnitin: 'Revisión Turnitin',
  carpeta_tesis: 'Carpeta de Tesis',
  derecho_sustentacion: 'Derecho de Sustentación',
};

const configEstadoPago: Record<string, { color: string; label: string; icon: any }> = {
  pendiente: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendiente', icon: Clock },
  comprobante_cargado: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'En verificación', icon: Loader2 },
  verificado: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Verificado', icon: CheckCircle2 },
  rechazado: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rechazado', icon: XCircle },
};

export default function MisPagosPage() {
  const { user, hasRole } = useAuth();

  const { data: estudiante, isLoading: loadingEstudiante, isFetched: estudianteFetched } = useQuery({
    queryKey: ['mis-pagos-estudiante', user?.id],
    queryFn: () => estudiantesApi.getByUserId(user!.id).then((r) => r.data.data),
    enabled: !!user?.id && hasRole('estudiante'),
  });

  const { data: tesisList } = useQuery({
    queryKey: ['mis-pagos-tesis', estudiante?.id],
    queryFn: () => tesisApi.getByEstudiante(estudiante!.id).then((r) => r.data.data),
    enabled: !!estudiante?.id,
  });

  const ids = (tesisList ?? []).map((t: { id: number }) => t.id);

  const { data: fullTesis, isFetching } = useQuery({
    queryKey: ['mis-pagos-tesis-full', ids.join(',')],
    queryFn: async () => {
      const rows = await Promise.all(
        ids.map((id) => tesisApi.getOne(id).then((r) => r.data.data)),
      );
      return rows;
    },
    enabled: ids.length > 0,
  });

  if (!hasRole('estudiante')) {
    return (
      <div className="p-8 text-center text-muted-foreground min-h-[40vh] flex items-center justify-center bg-card rounded-lg border border-dashed">
        <div className="space-y-2">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="font-medium text-foreground">Esta sección es de acceso exclusivo para estudiantes.</p>
          <p className="text-sm">Por favor, inicie sesión con una cuenta de estudiante válida.</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic stats for dashboard
  const allPagos = (fullTesis ?? []).flatMap((t: any) => t.pagos ?? []);
  const totalMonto = allPagos.reduce((acc: number, p: any) => acc + Number(p.monto || 0), 0);

  const pagosVerificados = allPagos.filter((p: any) => p.estado === 'verificado');
  const montoVerificado = pagosVerificados.reduce((acc: number, p: any) => acc + Number(p.monto || 0), 0);

  const pagosPendientes = allPagos.filter((p: any) => p.estado === 'pendiente' || p.estado === 'comprobante_cargado');
  const montoPendiente = pagosPendientes.reduce((acc: number, p: any) => acc + Number(p.monto || 0), 0);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis Pagos y Comprobantes</h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Obligaciones financieras y comprobantes asociados al desarrollo y sustentación de su tesis. Puede
          registrar nuevas solicitudes, subir comprobantes o vouchers, y realizar el seguimiento correspondiente
          desde la ficha detallada de cada una de sus tesis.
        </p>
      </div>

      {loadingEstudiante || !estudianteFetched ? (
        <div className="flex flex-col justify-center items-center py-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Cargando perfil del estudiante...</p>
        </div>
      ) : !estudiante ? (
        <div className="text-center py-12 px-6 rounded-xl bg-card border border-dashed shadow-sm space-y-3">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="font-semibold text-lg text-foreground">Perfil de estudiante no registrado</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            No pudimos localizar un registro de estudiante activo vinculado a su usuario. Por favor, póngase en contacto
            con la oficina de secretaría para regularizar su estado.
          </p>
        </div>
      ) : ids.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-xl bg-card border border-dashed shadow-sm space-y-4">
          <HelpCircle className="h-12 w-12 text-muted-foreground/50 mx-auto" />
          <div className="space-y-1">
            <p className="font-semibold text-lg text-foreground">Aún no cuenta con tesis registradas</p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Una vez que registre su tesis, podrá solicitar y gestionar pagos desde esta sección.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <Button asChild variant="default">
              <Link href="/tesis/nueva">Registrar tesis nueva</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tesis">Ver mis tesis</Link>
            </Button>
          </div>
        </div>
      ) : isFetching ? (
        <div className="flex flex-col justify-center items-center py-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Obteniendo obligaciones de pago...</p>
        </div>
      ) : (
        <>
          {/* Dashboard Summary Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Obligaciones
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground">S/ {totalMonto.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">({allPagos.length} items)</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pagos Verificados
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-emerald-600">S/ {montoVerificado.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">({pagosVerificados.length} items)</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pendientes / Carga
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-amber-600">S/ {montoPendiente.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">({pagosPendientes.length} items)</span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Thesis list & their respective payments */}
          <div className="space-y-6">
            {(fullTesis ?? []).map((t: any) => {
              const estConfig = estadosTesis[t.estado] || {
                color: 'bg-muted text-muted-foreground border-border',
                label: String(t.estado),
              };

              return (
                <Card key={t.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Tesis</span>
                          <Badge variant="outline" className={`${estConfig.color} border font-medium px-2 py-0.5 rounded-md`}>
                            {estConfig.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg leading-snug font-bold text-foreground">
                          {t.titulo}
                        </CardTitle>
                      </div>
                      <Button variant="default" size="sm" asChild className="shadow-sm shrink-0 self-start sm:self-center">
                        <Link href={`/tesis/${t.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Gestionar ficha
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {Array.isArray(t.pagos) && t.pagos.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          Obligaciones Registradas
                        </div>
                        <div className="border rounded-lg overflow-hidden divide-y">
                          {t.pagos.map((p: any) => {
                            const configPago = configEstadoPago[p.estado] || {
                              color: 'bg-muted text-muted-foreground border-border',
                              label: String(p.estado),
                              icon: HelpCircle,
                            };
                            const PagoIcon = configPago.icon;

                            return (
                              <div
                                key={p.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card hover:bg-muted/10 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-muted/40 text-muted-foreground shrink-0 mt-0.5">
                                    {p.tipo === 'turnitin' ? (
                                      <FileText className="h-4 w-4" />
                                    ) : (
                                      <Receipt className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-foreground">
                                      {labelPagoTipo[p.tipo] || String(p.tipo).replace(/_/g, ' ')}
                                    </p>
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center mt-1 text-xs text-muted-foreground">
                                      {p.comprobante_subido_en ? (
                                        <span>Subido: {formatDate(p.comprobante_subido_en)}</span>
                                      ) : (
                                        <span className="text-amber-600 font-medium">Sin voucher cargado</span>
                                      )}
                                      {p.observaciones && (
                                        <>
                                          <span className="hidden sm:inline">•</span>
                                          <span className="italic">Nota: {p.observaciones}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-4">
                                  <span className="font-bold text-sm text-foreground whitespace-nowrap">
                                    S/ {Number(p.monto).toFixed(2)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`${configPago.color} font-medium flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border shrink-0`}
                                  >
                                    {p.estado === 'comprobante_cargado' ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                    ) : (
                                      <PagoIcon className="h-3 w-3 shrink-0" />
                                    )}
                                    {configPago.label}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 rounded-lg bg-muted/20 border border-dashed p-4">
                        <CircleDollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm font-medium text-foreground">Sin pagos registrados en esta tesis.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ingrese a la ficha de la tesis para registrar una nueva solicitud de pago de Turnitin o Derechos.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

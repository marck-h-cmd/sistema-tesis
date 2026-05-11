'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { tesisApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ExternalLink, Receipt, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

export default function SecretariaGestionPagosPage() {
  const { hasRole, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const puede = hasRole('secretaria') || hasRole('admin') || hasRole('coordinador');

  const [obsPago, setObsPago] = useState<Record<number, string>>({});
  const [obsDoc, setObsDoc] = useState<Record<number, string>>({});

  useEffect(() => {
    if (user && !puede) router.replace('/dashboard');
  }, [user, puede, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['tesis-secretaria-cola-validacion'],
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
      toast.success('Pago actualizado');
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Error'),
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
      toast.success('Documento actualizado');
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Error'),
  });

  if (!user || !puede) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pagos = data.pagos_atencion ?? [];
  const docs = data.documentos_sin_validar ?? [];

  const nombreEst = (tesis: any) =>
    `${tesis?.estudiante?.usuario?.nombres ?? ''} ${tesis?.estudiante?.usuario?.apellidos ?? ''}`.trim();

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Gestión de pagos y documentos (tesis)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Valide comprobantes de pago pendientes y documentos de tesis que aún no están marcados como válidos administrativamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Pagos en atención
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay pagos pendientes o con comprobante por revisar.
            </p>
          ) : (
            pagos.map((p: any) => (
              <div key={p.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="capitalize mr-2">
                      {String(p.tipo).replace(/_/g, ' ')}
                    </Badge>
                    <Badge>{p.estado}</Badge>
                    <p className="font-medium mt-1">{nombreEst(p.tesis)}</p>
                    <p className="text-xs text-muted-foreground">
                      Tesis: {p.tesis?.titulo} · #{p.tesis?.id}
                    </p>
                    <p className="text-sm">S/ {p.monto}</p>
                    {p.comprobante_url && (
                      <a
                        href={p.comprobante_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary underline inline-flex items-center mt-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver comprobante
                      </a>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tesis/${p.tesis_id}`}>Ver ficha</Link>
                  </Button>
                </div>
                {p.observaciones && (
                  <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">{p.observaciones}</p>
                )}
                <Textarea
                  placeholder="Observaciones (opcional)"
                  value={obsPago[p.id] ?? ''}
                  onChange={(e) =>
                    setObsPago((s) => ({ ...s, [p.id]: e.target.value }))
                  }
                  rows={2}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={
                      mVerificarPago.isPending ||
                      (p.estado === 'pendiente' && !p.comprobante_url)
                    }
                    onClick={() =>
                      mVerificarPago.mutate({
                        tesisId: p.tesis_id,
                        pagoId: p.id,
                        estado: 'verificado',
                        observaciones: obsPago[p.id] || undefined,
                      })
                    }
                  >
                    Marcar pagado
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      mVerificarPago.isPending ||
                      (p.estado === 'pendiente' && !p.comprobante_url)
                    }
                    title={
                      p.estado === 'pendiente' && !p.comprobante_url
                        ? 'Espere el comprobante del estudiante para rechazar o verifique igualmente desde la ficha'
                        : ''
                    }
                    onClick={() =>
                      mVerificarPago.mutate({
                        tesisId: p.tesis_id,
                        pagoId: p.id,
                        estado: 'rechazado',
                        observaciones: obsPago[p.id] || 'Revisar datos',
                      })
                    }
                  >
                    Rechazar
                  </Button>
                  {p.estado === 'pendiente' && !p.comprobante_url && (
                    <span className="text-xs text-amber-700 self-center">
                      Aún sin comprobante cargado por el tesista.
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos de tesis pendientes de validación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay documentos sin marcar como validados.
            </p>
          ) : (
            docs.map((d: any) => (
              <div key={d.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <Badge variant="secondary" className="capitalize">
                      {String(d.tipo).replace(/_/g, ' ')} · v{d.version}
                    </Badge>
                    <p className="font-medium mt-1">{nombreEst(d.tesis)}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {d.tesis?.titulo}
                    </p>
                    <a
                      href={d.archivo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline inline-flex items-center mt-1"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Abrir archivo
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Subido {formatDate(d.subido_en)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tesis/${d.tesis_id}`}>Ficha tesis</Link>
                  </Button>
                </div>
                <Textarea
                  placeholder="Observaciones (opcional)"
                  value={obsDoc[d.id] ?? ''}
                  onChange={(e) =>
                    setObsDoc((s) => ({ ...s, [d.id]: e.target.value }))
                  }
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
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
                    Marcar válido
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mValidarDoc.isPending}
                    onClick={() =>
                      mValidarDoc.mutate({
                        tesisId: d.tesis_id,
                        documentoId: d.id,
                        validado: false,
                        observaciones: obsDoc[d.id] || 'Revisar documento',
                      })
                    }
                  >
                    Observar / no conforme
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

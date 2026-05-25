'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tesisApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Scale, ExternalLink, FileText, User } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

const estadoRevisionLabel: Record<string, string> = {
  pendiente: 'Pendiente de su revisión',
  observaciones: 'Emitió observaciones',
  conforme: 'Conforme',
};

const docTipoLabel: Record<string, string> = {
  tesis_final: 'Tesis final',
  version_corregida: 'Versión corregida',
  anexos: 'Anexos',
};

const estadoTesisLabel: Record<string, string> = {
  propuesta: 'Propuesta',
  desarrollo: 'Desarrollo',
  en_revision: 'En revisión (jurado)',
  observaciones_emitidas: 'Observaciones del jurado',
  observaciones_levantadas: 'Observaciones levantadas',
  aprobado_jurado: 'Aprobado por jurado',
  expedito: 'Expedito',
  sustentacion_programada: 'Sustentación programada',
  sustentado: 'Sustentado',
  culminado: 'Culminado',
};

type JuradoRow = {
  id: number;
  rol: string;
  asignado_en: string;
  revisiones?: Array<{
    id: number;
    estado: string;
    observaciones?: string | null;
    revisado_en?: string | null;
    conforme?: boolean;
  }>;
  tesis?: {
    id: number;
    titulo: string;
    estado: string;
    similitud_turnitin?: unknown;
    estudiante?: {
      usuario?: { nombres: string; apellidos: string; email?: string };
    };
    asesor_principal?: {
      usuario?: { nombres: string; apellidos: string };
    };
    documentos?: Array<{
      id: number;
      tipo: string;
      archivo_url: string;
      nombre_original?: string | null;
      version: number;
      subido_en: string;
      validado: boolean;
    }>;
  };
};

function similitudTexto(v: unknown): string | null {
  if (v == null) return null;
  const n = typeof v === 'object' && v !== null && 'toNumber' in v ? (v as { toNumber: () => number }).toNumber() : Number(v);
  if (Number.isNaN(n)) return null;
  return `${n}%`;
}

export default function RevisionConformidadJuradoPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const puedeVer = hasRole('asesor') || hasRole('coordinador') || hasRole('admin');

  useEffect(() => {
    if (user && !puedeVer) {
      router.replace('/dashboard');
    }
  }, [user, puedeVer, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['tesis-jurado-mis-revisiones'],
    queryFn: () => tesisApi.misRevisionesJurado().then((r) => r.data.data as JuradoRow[]),
    enabled: puedeVer,
  });

  const rows = useMemo(() => {
    const arr = Array.isArray(data) ? [...data] : [];
    const pendiente = (row: JuradoRow) => row.revisiones?.[0]?.estado === 'pendiente';
    return arr.sort((a, b) => {
      if (pendiente(a) && !pendiente(b)) return -1;
      if (!pendiente(a) && pendiente(b)) return 1;
      return 0;
    });
  }, [data]);

  if (!user || !puedeVer) {
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

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            Revisión de conformidad (jurado)
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
            Aquí aparecen las tesis en las que fue designado como jurado. Revise los documentos
            enviados (tesis final, versiones corregidas, anexos) y registre{' '}
            <strong>conformidad</strong> u <strong>observaciones</strong> desde la ficha de la tesis
            cuando ya existan tres jurados asignados.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No tiene designaciones como jurado, o su usuario no está vinculado a un perfil de
            docente (asesor) en el sistema.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const t = row.tesis;
            if (!t) return null;
            const rev = row.revisiones?.[0];
            const estadoRev = rev?.estado ?? 'pendiente';
            const est = t.estudiante?.usuario;
            const nombreEst = est ? `${est.nombres} ${est.apellidos}` : '—';
            const ap = t.asesor_principal?.usuario;
            const nombreAp = ap ? `${ap.nombres} ${ap.apellidos}` : '—';
            const sim = similitudTexto(t.similitud_turnitin);

            return (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg leading-snug">{t.titulo}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Tesis #{t.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="capitalize">
                        Jurado: {row.rol}
                      </Badge>
                      <Badge
                        variant={
                          estadoRev === 'conforme'
                            ? 'default'
                            : estadoRev === 'observaciones'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {estadoRevisionLabel[estadoRev] ?? estadoRev}
                      </Badge>
                      <Badge variant="secondary">
                        {estadoTesisLabel[t.estado] ?? t.estado}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-6 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-4 w-4 shrink-0" />
                      <span>
                        <span className="text-foreground font-medium">Estudiante:</span> {nombreEst}
                      </span>
                    </span>
                    <span>
                      <span className="text-foreground font-medium">Asesor principal:</span>{' '}
                      {nombreAp}
                    </span>
                    {sim != null && (
                      <span>
                        <span className="text-foreground font-medium">Similitud Turnitin:</span> {sim}
                      </span>
                    )}
                    <span>
                      <span className="text-foreground font-medium">Designado:</span>{' '}
                      {row.asignado_en ? formatDate(row.asignado_en) : '—'}
                    </span>
                  </div>

                  {rev?.observaciones && (
                    <div className="rounded-md border bg-muted/30 p-3 text-xs">
                      <p className="font-medium text-foreground mb-1">Últimas observaciones registradas</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{rev.observaciones}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Documentos enviados para revisión
                    </p>
                    {!t.documentos?.length ? (
                      <p className="text-xs text-muted-foreground">
                        Aún no hay tesis final, versión corregida ni anexos registrados en el expediente.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {t.documentos.map((d) => (
                          <li
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-xs border rounded-md px-2 py-1.5"
                          >
                            <span>
                              <span className="font-medium">{docTipoLabel[d.tipo] ?? d.tipo}</span>
                              {d.nombre_original ? ` · ${d.nombre_original}` : ''}
                              <span className="text-muted-foreground">
                                {' '}
                                · v{d.version} · {formatDate(d.subido_en)}
                                {d.validado ? ' · Validado admin.' : ''}
                              </span>
                            </span>
                            <a
                              href={d.archivo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary inline-flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Abrir PDF
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button asChild size="sm">
                      <Link href={`/tesis/${t.id}`}>
                        Ir a ficha de tesis — registrar conformidad u observaciones
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

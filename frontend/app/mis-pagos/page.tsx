'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { estudiantesApi, tesisApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

export default function MisPagosPage() {
  const { user, hasRole } = useAuth();

  const { data: estudiante, isLoading: loadingEstudiante, isFetched: estudianteFetched } = useQuery({
    queryKey: ['mis-pagos-estudiante', user?.id],
    queryFn: () => estudiantesApi.getByUserId(user!.id).then((r) => r.data.data),
    enabled: !!user?.id && hasRole('estudiante'),
  });

  const { data: tesisList } = useQuery({
    queryKey: ['mis-pagos-tesis', estudiante?.id],
    queryFn: () =>
      tesisApi.getByEstudiante(estudiante!.id).then((r) => r.data.data),
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
      <div className="p-8 text-center text-muted-foreground">
        Esta sección es solo para estudiantes.
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis pagos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Obligaciones y comprobantes vinculados a su tesis. Puede registrar una solicitud de pago,
          cargar vouchers y hacer seguimiento del estado desde la ficha completa de cada tesis.
        </p>
      </div>

      {loadingEstudiante || !estudianteFetched ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !estudiante ? (
        <p className="text-sm text-muted-foreground">
          No tiene perfil de estudiante registrado. Contacte a secretaría.
        </p>
      ) : ids.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aún no tiene una tesis registrada. Una vez registrada, podrá solicitar pagos desde la{' '}
          <Link href="/tesis/nueva" className="text-primary underline">
            alta de tesis
          </Link>{' '}
          o revisar desde{' '}
          <Link href="/tesis" className="text-primary underline">
            mis tesis
          </Link>
          .
        </p>
      ) : isFetching ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        (fullTesis ?? []).map((t: any) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row flex-wrap justify-between gap-2">
              <CardTitle className="text-lg leading-tight">{t.titulo}</CardTitle>
              <Badge variant="secondary">{t.estado}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tesis/${t.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Gestionar solicitudes y comprobantes
                </Link>
              </Button>
              {Array.isArray(t.pagos) && t.pagos.length > 0 ? (
                <ul className="space-y-2 text-sm border-t pt-4">
                  {t.pagos.map((p: any) => (
                    <li key={p.id} className="flex flex-wrap justify-between gap-2">
                      <span className="capitalize">{String(p.tipo).replace(/_/g, ' ')}</span>
                      <span>S/ {p.monto}</span>
                      <Badge variant="outline">{p.estado}</Badge>
                      {p.comprobante_subido_en && (
                        <span className="text-xs text-muted-foreground">
                          Subido {formatDate(p.comprobante_subido_en)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground pt-4 border-t">
                  Sin pagos registrados. En la ficha puede crear una solicitud de pago.
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

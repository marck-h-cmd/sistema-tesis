'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tesisApi } from '@/lib/api/endpoints';
import { AvanceForm } from '@/components/forms/AvanceForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RegistrarAvancePage() {
  const params = useParams();
  const router = useRouter();
  const tesisId = Number(params.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tesis, isLoading: isLoadingTesis } = useQuery({
    queryKey: ['tesis', tesisId],
    queryFn: () => tesisApi.getOne(tesisId).then((res) => res.data.data),
    enabled: !Number.isNaN(tesisId),
  });

  const handleSubmit = async (data: any) => {
    if (Number.isNaN(tesisId)) {
      toast.error('ID de tesis inválido');
      return;
    }

    setIsSubmitting(true);
    try {
      await tesisApi.registrarAvance(tesisId, data);
      toast.success('Avance registrado correctamente');
      router.push(`/tesis/${tesisId}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al registrar el avance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTesis) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tesis) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto text-center text-gray-600">
          <p className="text-lg font-medium">No se encontró la tesis.</p>
          <Link href="/tesis" className="inline-flex items-center mt-4 text-primary underline">
            Volver a Tesis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Registrar avance</h1>
            <p className="text-muted-foreground mt-1">Tesis: {tesis.titulo}</p>
          </div>
          <Link href={`/tesis/${tesisId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo avance de tesis</CardTitle>
              <CardDescription>
                Registra el progreso de tu tesis con fecha de entrega, tipo y descripción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvanceForm onSubmit={handleSubmit} isLoading={isSubmitting} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

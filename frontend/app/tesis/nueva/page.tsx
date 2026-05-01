'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tesisApi } from '@/lib/api/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NuevaTesisPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    resumen: '',
    estudiante_id: 1,
    asesor_principal_id: 1,
    fecha_inicio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await tesisApi.create(formData);
      toast.success('Tesis registrada exitosamente');
      router.push('/tesis');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar tesis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estudiante_id' || name === 'asesor_principal_id' ? Number(value) : value,
    }));
  };

  return (
    <div>
      <Link href="/tesis" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a tesis
      </Link>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nueva Tesis</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título de la tesis</label>
                <Input
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: Sistema de Gestión de Prácticas Preprofesionales"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resumen</label>
                <textarea
                  name="resumen"
                  value={formData.resumen}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Resumen del proyecto de tesis..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Estudiante</label>
                  <Input
                    type="number"
                    name="estudiante_id"
                    value={formData.estudiante_id}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Asesor Principal</label>
                  <Input
                    type="number"
                    name="asesor_principal_id"
                    value={formData.asesor_principal_id}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de inicio</label>
                <Input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/tesis">
                  <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Registrar Tesis'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
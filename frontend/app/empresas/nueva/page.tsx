'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { empresasApi } from '@/lib/api/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NuevaEmpresaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    direccion: '',
    telefono: '',
    email_contacto: '',
    representante: '',
    convenio_activo: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await empresasApi.create(formData);
      toast.success('Empresa registrada exitosamente');
      router.push('/empresas');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div>
      <Link href="/empresas" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a empresas
      </Link>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nueva Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">RUC</label>
                  <Input
                    name="ruc"
                    value={formData.ruc}
                    onChange={handleChange}
                    maxLength={11}
                    placeholder="20123456789"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Razón Social</label>
                  <Input
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleChange}
                    placeholder="Empresa XYZ S.A.C."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Av. Principal 123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="999888777"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email de contacto</label>
                  <Input
                    name="email_contacto"
                    type="email"
                    value={formData.email_contacto}
                    onChange={handleChange}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Representante</label>
                <Input
                  name="representante"
                  value={formData.representante}
                  onChange={handleChange}
                  placeholder="Nombre del representante"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="convenio_activo"
                  id="convenio_activo"
                  checked={formData.convenio_activo}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="convenio_activo" className="text-sm font-medium">
                  Tiene convenio activo
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/empresas">
                  <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Registrar Empresa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
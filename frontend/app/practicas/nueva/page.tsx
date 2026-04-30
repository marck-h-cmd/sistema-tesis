'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCreateOferta } from '@/lib/hooks/useOfertas';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NuevaOfertaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const createOferta = useCreateOferta();

  const [formData, setFormData] = useState({
    empresa_id: 1,
    titulo: '',
    descripcion: '',
    requisitos: '',
    fecha_inicio: '',
    fecha_fin: '',
    vacantes: 1,
    modalidad: 'presencial',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOferta.mutateAsync(formData);
      router.push('/practicas');
    } catch (error) {
      console.error('Error al crear oferta:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/practicas"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a prácticas
            </Link>

            <Card>
              <CardHeader>
                <CardTitle>Nueva Oferta de Práctica</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título de la oferta</label>
                    <Input
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      placeholder="Ej: Practicante de Desarrollo Web"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Describe las actividades y responsabilidades..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Requisitos</label>
                    <textarea
                      name="requisitos"
                      value={formData.requisitos}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Conocimientos y habilidades requeridas..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha de inicio</label>
                      <Input
                        type="date"
                        name="fecha_inicio"
                        value={formData.fecha_inicio}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha de fin</label>
                      <Input
                        type="date"
                        name="fecha_fin"
                        value={formData.fecha_fin}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vacantes</label>
                      <Input
                        type="number"
                        name="vacantes"
                        value={formData.vacantes}
                        onChange={handleChange}
                        min={1}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Modalidad</label>
                      <select
                        name="modalidad"
                        value={formData.modalidad}
                        onChange={handleChange}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                      >
                        <option value="presencial">Presencial</option>
                        <option value="remota">Remota</option>
                        <option value="hibrida">Híbrida</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Link href="/practicas">
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </Link>
                    <Button type="submit" disabled={createOferta.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {createOferta.isPending ? 'Guardando...' : 'Guardar Oferta'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
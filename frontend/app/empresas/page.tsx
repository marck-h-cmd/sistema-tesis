'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { empresasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  FileCheck,
  Briefcase,
  Edit
} from 'lucide-react';
import { EmpresaEditForm } from '@/components/forms/EmpresaEditForm';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function EmpresasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmpresa, setEditingEmpresa] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { hasRole } = useAuth();

  const { data: empresas, isLoading, refetch } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.getAll().then(res => res.data.data),
  });

  const handleEditEmpresa = async (data: any) => {
    if (!editingEmpresa) return;

    setIsEditing(true);
    try {
      await empresasApi.update(editingEmpresa.id, data);
      toast.success('Empresa actualizada exitosamente');
      setEditingEmpresa(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar la empresa');
    } finally {
      setIsEditing(false);
    }
  };

  const openEditModal = (empresa: any) => {
    setEditingEmpresa(empresa);
  };

  const closeEditModal = () => {
    setEditingEmpresa(null);
  };

  const filteredEmpresas = empresas?.filter((emp: any) =>
    emp.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.ruc.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50">

        
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Empresas</h1>
              <p className="text-muted-foreground mt-1">
                Empresas registradas en el sistema
              </p>
            </div>
            {(hasRole('admin') || hasRole('coordinador')) && (
              <Link href="/empresas/nueva">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Empresa
              </Button>
              </Link>
            )}
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Buscar por razón social o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmpresas?.map((empresa: any) => (
              <Card key={empresa.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{empresa.razon_social}</h3>
                        <p className="text-sm text-muted-foreground">RUC: {empresa.ruc}</p>
                      </div>
                    </div>
                    <Badge className={empresa.convenio_activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {empresa.convenio_activo ? 'Convenio Vigente' : 'Sin Convenio'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {empresa.direccion && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {empresa.direccion}
                      </div>
                    )}
                    {empresa.telefono && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        {empresa.telefono}
                      </div>
                    )}
                    {empresa.email_contacto && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        {empresa.email_contacto}
                      </div>
                    )}
                  </div>

                  {empresa._count && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center text-primary">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold mt-1">{empresa._count.ofertas}</p>
                        <p className="text-xs text-muted-foreground">Ofertas</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-green-600">
                          <FileCheck className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold mt-1">{empresa._count.convenios}</p>
                        <p className="text-xs text-muted-foreground">Convenios</p>
                      </div>
                    </div>
                  )}

                  {/* Botón de editar para admins y coordinadores */}
                  {(hasRole('admin') || hasRole('coordinador')) && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(empresa)}
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
   
      {/* Modal de edición */}
      <Dialog
        open={!!editingEmpresa}
        onClose={closeEditModal}
        title="Editar Empresa"
      >
        {editingEmpresa && (
          <EmpresaEditForm
            empresa={editingEmpresa}
            onSubmit={handleEditEmpresa}
            onCancel={closeEditModal}
            isLoading={isEditing}
          />
        )}
      </Dialog>
    </div>
  );
}
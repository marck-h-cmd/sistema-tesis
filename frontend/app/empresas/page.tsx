'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { empresasApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
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
  Briefcase
} from 'lucide-react';

export default function EmpresasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasRole } = useAuth();

  const { data: empresas, isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.getAll().then(res => res.data.data),
  });

  const filteredEmpresas = empresas?.filter((emp: any) =>
    emp.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.ruc.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Empresas</h1>
              <p className="text-muted-foreground mt-1">
                Empresas registradas en el sistema
              </p>
            </div>
            {(hasRole('admin') || hasRole('coordinador')) && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Empresa
              </Button>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
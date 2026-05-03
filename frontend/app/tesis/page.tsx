'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { tesisApi, estudiantesApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  GraduationCap,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { formatDate } from '@/lib/utils/formatDate';

const estadosTesis: Record<string, { color: string; label: string }> = {
  propuesta: { color: 'bg-blue-100 text-blue-800', label: 'Propuesta' },
  desarrollo: { color: 'bg-yellow-100 text-yellow-800', label: 'En Desarrollo' },
  sustentacion: { color: 'bg-purple-100 text-purple-800', label: 'En Sustentación' },
  culminado: { color: 'bg-green-100 text-green-800', label: 'Culminado' },
};

export default function TesisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { hasRole, user } = useAuth();

  console.log("user",user);

  // Query para obtener el estudiante si el usuario es estudiante
  const { data: estudiante, isLoading: isLoadingEstudiante } = useQuery({
    queryKey: ['estudiante', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await estudiantesApi.getByUserId(user.id);
      return response.data.data;
    },
    enabled: hasRole('estudiante') && !!user?.id,
  });

  // Query para obtener las tesis según el rol
  const { data: tesis, isLoading: isLoadingTesis, error } = useQuery({
    queryKey: ['tesis', hasRole('estudiante') ? `estudiante_${estudiante?.id}` : 'all'],
    queryFn: async () => {
      if (hasRole('estudiante')) {
        // Si es estudiante, obtener solo sus tesis
        if (!estudiante?.id) {
          return [];
        }
        const response = await tesisApi.getByEstudiante(estudiante.id);
        return response.data.data;
      } else {
        // Si es admin, coordinador o asesor, obtener todas las tesis
        const response = await tesisApi.getAll();
        return response.data.data;
      }
    },
    enabled: !hasRole('estudiante') || (hasRole('estudiante') && !!estudiante?.id),
  });

  const isLoading = isLoadingEstudiante || isLoadingTesis;

  // Filtrar tesis por término de búsqueda
  const filteredTesis = tesis?.filter((t: any) =>
    t.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.estudiante?.usuario?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.estudiante?.usuario?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateTesis = hasRole('admin') || hasRole('coordinador') || hasRole('estudiante');

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Tesis</h1>
            <p className="text-muted-foreground mt-1">
              {hasRole('estudiante') 
                ? `Mis proyectos de tesis${estudiante ? ` - ${estudiante.codigo_universitario}` : ''}` 
                : 'Gestión de proyectos de tesis'}
            </p>
          </div>
          {canCreateTesis && (
            <Link href="/tesis/nueva">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tesis
              </Button>
            </Link>
          )}
        </div>

        {/* Error handling */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error al cargar las tesis. Por favor, intenta de nuevo más tarde.
          </div>
        )}

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Buscar tesis por título o estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Tesis grid */}
            {filteredTesis && filteredTesis.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTesis.map((t: any) => {
                  const estadoConfig = estadosTesis[t.estado] || { 
                    color: 'bg-gray-100 text-gray-800', 
                    label: t.estado 
                  };
                  
                  return (
                    <Link key={t.id} href={`/tesis/${t.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                                {t.titulo}
                              </h3>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <User className="h-4 w-4 mr-1" />
                                {t.estudiante?.usuario?.nombres} {t.estudiante?.usuario?.apellidos}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <Badge className={estadoConfig.color}>
                              {estadoConfig.label}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {t.fecha_inicio ? formatDate(t.fecha_inicio) : 'Sin fecha'}
                            </div>
                          </div>

                          {/* Escuela del estudiante */}
                          {t.estudiante?.escuela && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {t.estudiante.escuela.nombre}
                            </div>
                          )}

                          {/* Asesor principal */}
                          {t.asesor_principal && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GraduationCap className="h-4 w-4" />
                                <span>
                                  Asesor: {t.asesor_principal.usuario?.nombres} {t.asesor_principal.usuario?.apellidos}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Nota final */}
                          {t.acta && t.acta.nota_final && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Nota Final:</span>
                                <span className="text-lg font-bold text-primary">
                                  {t.acta.nota_final}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  {searchTerm 
                    ? 'No se encontraron tesis que coincidan con la búsqueda'
                    : hasRole('estudiante')
                    ? 'Aún no tienes tesis registradas'
                    : 'No hay tesis registradas'}
                </p>
                {canCreateTesis && !searchTerm && (
                  <Link href="/tesis/nueva">
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      {hasRole('estudiante') ? 'Registrar Mi Tesis' : 'Registrar Nueva Tesis'}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
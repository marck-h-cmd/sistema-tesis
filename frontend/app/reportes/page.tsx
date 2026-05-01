'use client';

import React, { useState } from 'react';
import { reportesApi } from '@/lib/api/endpoints';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  FileText,
  Download,
  Briefcase,
  GraduationCap,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generando, setGenerando] = useState<string | null>(null);

  const handleGenerarReporte = async (tipo: string) => {
    setGenerando(tipo);
    try {
      let response;
      let filename = '';

      switch (tipo) {
        case 'practicas':
          response = await reportesApi.generarPracticas();
          filename = `reporte-practicas-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'tesis':
          response = await reportesApi.generarTesis();
          filename = `reporte-tesis-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        case 'empresas':
          response = await reportesApi.generarEmpresas();
          filename = `reporte-empresas-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
      }

      // Descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Reporte generado exitosamente');
    } catch (error: any) {
      toast.error('Error al generar el reporte');
      console.error(error);
    } finally {
      setGenerando(null);
    }
  };

  const reportes = [
    {
      tipo: 'practicas',
      titulo: 'Reporte de Prácticas',
      descripcion: 'Listado completo de prácticas preprofesionales con estadísticas',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      tipo: 'tesis',
      titulo: 'Reporte de Tesis',
      descripcion: 'Estado actual de todas las tesis registradas',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      tipo: 'empresas',
      titulo: 'Reporte de Empresas',
      descripcion: 'Directorio de empresas y estado de convenios',
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
   
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Reportes</h1>
            <p className="text-muted-foreground mt-1">
              Generación de reportes en formato PDF
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reportes.map((reporte) => (
              <Card key={reporte.tipo} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`${reporte.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <reporte.icon className={`h-6 w-6 ${reporte.color}`} />
                  </div>
                  <CardTitle>{reporte.titulo}</CardTitle>
                  <CardDescription>{reporte.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleGenerarReporte(reporte.tipo)}
                    disabled={generando === reporte.tipo}
                  >
                    {generando === reporte.tipo ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generar PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reportes Adicionales */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Reportes Adicionales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Exportar Datos</h3>
                      <p className="text-sm text-muted-foreground">
                        Descargar datos en formato Excel
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Próximamente
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold">Reporte Consolidado</h3>
                      <p className="text-sm text-muted-foreground">
                        Informe general del sistema
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Próximamente
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
  
    </div>
  );
}
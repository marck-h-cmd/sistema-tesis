import { useMutation, useQuery } from '@tanstack/react-query';
import { reportesApi } from '../api/endpoints';
import { toast } from 'sonner';

export function useGenerarReporte() {
  return useMutation({
    mutationFn: (tipo: 'practicas' | 'tesis' | 'empresas') => {
      switch (tipo) {
        case 'practicas':
          return reportesApi.generarPracticas();
        case 'tesis':
          return reportesApi.generarTesis();
        case 'empresas':
          return reportesApi.generarEmpresas();
      }
    },
    onSuccess: (data, tipo) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte generado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al generar el reporte');
    },
  });
}

export function useHistorialReportes() {
  return useQuery({
    queryKey: ['reportes-historial'],
    queryFn: () => reportesApi.getHistorial().then(res => res.data.data),
  });
}
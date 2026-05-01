import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seguimientoApi } from '../api/endpoints';
import { toast } from 'sonner';

export function useSeguimientos(params?: any) {
  return useQuery({
    queryKey: ['seguimientos', params],
    queryFn: () => seguimientoApi.getAll(params).then(res => res.data.data),
  });
}

export function useSeguimiento(id: number) {
  return useQuery({
    queryKey: ['seguimiento', id],
    queryFn: () => seguimientoApi.getOne(id).then(res => res.data.data),
    enabled: !!id,
  });
}

export function useUpdateHoras() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, horas, tipo }: { id: number; horas: number; tipo: 'sumar' | 'restar' }) =>
      seguimientoApi.updateHoras(id, { horas, tipo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguimientos'] });
      queryClient.invalidateQueries({ queryKey: ['seguimiento'] });
      toast.success('Horas actualizadas');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar horas');
    },
  });
}

export function useEvaluarPractica() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, evaluacion, observaciones }: { id: number; evaluacion: string; observaciones?: string }) =>
      seguimientoApi.evaluar(id, { evaluacion, observaciones }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguimientos'] });
      toast.success('Práctica evaluada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al evaluar práctica');
    },
  });
}
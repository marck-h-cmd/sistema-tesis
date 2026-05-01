import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tesisApi } from '../api/endpoints';
import { toast } from 'sonner';

export function useTesis(params?: any) {
  return useQuery({
    queryKey: ['tesis', params],
    queryFn: () => tesisApi.getAll(params).then(res => res.data.data),
  });
}

export function useTesisDetail(id: number) {
  return useQuery({
    queryKey: ['tesis', id],
    queryFn: () => tesisApi.getOne(id).then(res => res.data.data),
    enabled: !!id,
  });
}

export function useCreateTesis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => tesisApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tesis'] });
      toast.success('Tesis registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar tesis');
    },
  });
}

export function useUpdateTesisEstado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      tesisApi.updateEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tesis'] });
      toast.success('Estado de tesis actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    },
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresasApi } from '../api/endpoints';
import { toast } from 'sonner';

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.getAll().then(res => res.data.data),
  });
}

export function useEmpresa(id: number) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresasApi.getOne(id).then(res => res.data.data),
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => empresasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa registrada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar empresa');
    },
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      empresasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar empresa');
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => empresasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast.success('Empresa eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar empresa');
    },
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estudiantesApi } from '../api/endpoints';
import { toast } from 'sonner';

export function useEstudiantes() {
  return useQuery({
    queryKey: ['estudiantes'],
    queryFn: () => estudiantesApi.getAll().then(res => res.data.data),
  });
}

export function useEstudiante(id: number) {
  return useQuery({
    queryKey: ['estudiante', id],
    queryFn: () => estudiantesApi.getOne(id).then(res => res.data.data),
    enabled: !!id,
  });
}

export function useCreateEstudiante() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => estudiantesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudiantes'] });
      toast.success('Estudiante registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar estudiante');
    },
  });
}
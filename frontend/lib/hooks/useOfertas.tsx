import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ofertasApi } from '../api/endpoints';
import { toast } from 'sonner';

export function useOfertas(params?: any) {
  return useQuery({
    queryKey: ['ofertas', params],
    queryFn: () => ofertasApi.getAll(params).then(res => res.data.data),
  });
}

export function useOferta(id: number) {
  return useQuery({
    queryKey: ['oferta', id],
    queryFn: () => ofertasApi.getOne(id).then(res => res.data.data),
    enabled: !!id,
  });
}

export function useCreateOferta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ofertasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      toast.success('Oferta creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear oferta');
    },
  });
}

export function usePostularOferta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ofertaId, data }: { ofertaId: number; data: any }) =>
      ofertasApi.postular(ofertaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      toast.success('Postulación realizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al postular');
    },
  });
}
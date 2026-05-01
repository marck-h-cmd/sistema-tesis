import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/endpoints';

export function useDashboardResumen() {
  return useQuery({
    queryKey: ['dashboard-resumen'],
    queryFn: () => dashboardApi.getResumen().then(res => res.data.data),
    refetchInterval: 30000,
  });
}

export function useDashboardCompleto() {
  return useQuery({
    queryKey: ['dashboard-completo'],
    queryFn: () => dashboardApi.getCompleto().then(res => res.data.data),
    refetchInterval: 60000,
  });
}

export function useDashboardPracticas() {
  return useQuery({
    queryKey: ['dashboard-practicas'],
    queryFn: () => dashboardApi.getPracticas().then(res => res.data.data),
  });
}

export function useDashboardTesis() {
  return useQuery({
    queryKey: ['dashboard-tesis'],
    queryFn: () => dashboardApi.getTesis().then(res => res.data.data),
  });
}

export function useIndicadores() {
  return useQuery({
    queryKey: ['indicadores'],
    queryFn: () => dashboardApi.getIndicadores().then(res => res.data.data),
  });
}
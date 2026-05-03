import { apiClient } from './client';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
  Estudiante,
  Empresa,
  OfertaPractica,
  Postulacion,
  Tesis,
  DashboardData,
} from '../types';

// Auth
export const authApi = {
  login: (data: LoginCredentials) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),
  register: (data: RegisterData) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data),
  me: () => apiClient.get('/auth/me'),
};

// Estudiantes
export const estudiantesApi = {
  getAll: () => apiClient.get<ApiResponse<Estudiante[]>>('/estudiantes'),
  getOne: (id: number) => apiClient.get<ApiResponse<Estudiante>>(`/estudiantes/${id}`),
  create: (data: any) => apiClient.post('/estudiantes', data),
  update: (id: number, data: any) => apiClient.put(`/estudiantes/${id}`, data),
  delete: (id: number) => apiClient.delete(`/estudiantes/${id}`),
  getByUserId: (userId: number) =>   apiClient.get<ApiResponse<Estudiante>>(`/estudiantes/user/${userId}`)
};

// Empresas
export const empresasApi = {
  getAll: () => apiClient.get<ApiResponse<Empresa[]>>('/empresas'),
  getOne: (id: number) => apiClient.get<ApiResponse<Empresa>>(`/empresas/${id}`),
  create: (data: any) => apiClient.post('/empresas', data),
  update: (id: number, data: any) => apiClient.put(`/empresas/${id}`, data),
  delete: (id: number) => apiClient.delete(`/empresas/${id}`),
  getEstadisticas: () => apiClient.get('/empresas/estadisticas'),
};

// Ofertas
export const ofertasApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<OfertaPractica[]>>('/ofertas', { params }),
  getOne: (id: number) => apiClient.get<ApiResponse<OfertaPractica>>(`/ofertas/${id}`),
  create: (data: any) => apiClient.post('/ofertas', data),
  update: (id: number, data: any) => apiClient.put(`/ofertas/${id}`, data),
  delete: (id: number) => apiClient.delete(`/ofertas/${id}`),
  cerrar: (id: number) => apiClient.post(`/ofertas/${id}/cerrar`),
  postular: (ofertaId: number, data: any) =>
    apiClient.post(`/ofertas/${ofertaId}/postulaciones`, data),
  getPostulaciones: (ofertaId: number) =>
    apiClient.get(`/ofertas/${ofertaId}/postulaciones`),
  updateEstadoPostulacion: (postulacionId: number, data: any) =>
    apiClient.put(`/ofertas/postulaciones/${postulacionId}/estado`, data),
  getMisPostulaciones: () => 
    apiClient.get<ApiResponse<Postulacion[]>>('/ofertas/mis-postulaciones'),
};

// Seguimiento
export const seguimientoApi = {
  getAll: (params?: any) => apiClient.get('/seguimiento', { params }),
  getOne: (id: number) => apiClient.get(`/seguimiento/${id}`),
  updateHoras: (id: number, data: any) => apiClient.put(`/seguimiento/${id}/horas`, data),
  updateInformes: (id: number, data: any) => apiClient.put(`/seguimiento/${id}/informes`, data),
  evaluar: (id: number, data: any) => apiClient.put(`/seguimiento/${id}/evaluar`, data),
  getEstadisticas: () => apiClient.get('/seguimiento/estadisticas'),
};

// Tesis
export const tesisApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<Tesis[]>>('/tesis', { params }),
  getByEstudiante: (estudianteId: number) =>
    apiClient.get<ApiResponse<Tesis[]>>(`/tesis/estudiante/${estudianteId}`),
  getOne: (id: number) => apiClient.get<ApiResponse<Tesis>>(`/tesis/${id}`),
  create: (data: any) => apiClient.post('/tesis', data),
  update: (id: number, data: any) => apiClient.put(`/tesis/${id}`, data),
  updateEstado: (id: number, estado: string) =>
    apiClient.put(`/tesis/${id}/estado`, { estado }),
  asignarJurados: (id: number, jurados: any[]) =>
    apiClient.post(`/tesis/${id}/jurados`, jurados),
  crearActa: (id: number, data: any) => apiClient.post(`/tesis/${id}/acta`, data),
  getAvances: (id: number) => apiClient.get(`/tesis/${id}/avances`),
  registrarAvance: (id: number, data: any) => apiClient.post(`/tesis/${id}/avances`, data),
  getEstadisticas: () => apiClient.get('/tesis/estadisticas'),
};

// Dashboard
export const dashboardApi = {
  getResumen: () => apiClient.get('/dashboard/resumen'),
  getCompleto: () => apiClient.get<ApiResponse<DashboardData>>('/dashboard/completo'),
  getPracticas: () => apiClient.get('/dashboard/practicas'),
  getTesis: () => apiClient.get('/dashboard/tesis'),
  getEmpresas: () => apiClient.get('/dashboard/empresas'),
  getIndicadores: () => apiClient.get('/dashboard/indicadores'),
};

// Reportes
export const reportesApi = {
  generarPracticas: () =>
    apiClient.post('/reportes/practicas', {}, { responseType: 'blob' }),
  generarTesis: () =>
    apiClient.post('/reportes/tesis', {}, { responseType: 'blob' }),
  generarEmpresas: () =>
    apiClient.post('/reportes/empresas', {}, { responseType: 'blob' }),
  verDocumentoTesis: (tesisId: number) =>
    apiClient.get(`/reportes/tesis/${tesisId}/documento`, { responseType: 'blob' }),
  descargarInformeTesis: (tesisId: number) =>
    apiClient.get(`/reportes/tesis/${tesisId}/descargar`, { responseType: 'blob' }),
  getHistorial: () => apiClient.get('/reportes/historial'),
  descargar: (id: number) =>
    apiClient.get(`/reportes/${id}/descargar`, { responseType: 'blob' }),
};

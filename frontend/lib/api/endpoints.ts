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
  Asesor,
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
  getByUserId: (userId: number) =>
    apiClient.get<ApiResponse<Estudiante>>(`/estudiantes/user/${userId}`),
  getEstadoModulos: (estudianteId: number) =>
    apiClient.get(`/estudiantes/${estudianteId}/estado-modulos`),
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

// Asesores
export const asesoresApi = {
  getAll: () => apiClient.get<ApiResponse<Asesor[]>>('/asesores'),
  getOne: (id: number) => apiClient.get<ApiResponse<Asesor>>(`/asesores/${id}`),
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

// Seguimiento (id = Practica en backend)
export const seguimientoApi = {
  getAll: (params?: any) => apiClient.get('/seguimiento', { params }),
  getOne: (id: number) => apiClient.get(`/seguimiento/${id}`),
  updateHoras: (id: number, data: any) => apiClient.put(`/seguimiento/${id}/horas`, data),
  updateInformes: (id: number, data: any) => apiClient.put(`/seguimiento/${id}/informes`, data),
  evaluar: (id: number, data: any) => apiClient.put(`/seguimiento/${id}/evaluar`, data),
  getEstadisticas: () => apiClient.get('/seguimiento/estadisticas'),
  listarReportesMensuales: (practicaId: number) =>
    apiClient.get(`/seguimiento/${practicaId}/reportes-mensuales`),
  registrarReporteMensual: (
    practicaId: number,
    body: {
      anio: number;
      mes: number;
      horas_reportadas: number;
      archivo_url?: string;
      observaciones?: string;
    },
  ) => apiClient.post(`/seguimiento/${practicaId}/reportes-mensuales`, body),
  validarReporteMensual: (
    practicaId: number,
    reporteId: number,
    body: { validado: boolean; observaciones?: string },
  ) =>
    apiClient.put(
      `/seguimiento/${practicaId}/reportes-mensuales/${reporteId}/validar`,
      body,
    ),
};

// Prácticas (flujo plan → ejecución → informe)
export const practicasApi = {
  secretariaCola: () => apiClient.get('/practicas/secretaria/cola'),
  asesorCola: () => apiClient.get('/practicas/asesor/cola'),
  pendientesAsignacionAsesor: () =>
    apiClient.get('/practicas/pendientes-asignacion-asesor'),
  byPostulacion: (postulacionId: number) =>
    apiClient.get(`/practicas/postulacion/${postulacionId}`),
  getOne: (practicaId: number) => apiClient.get(`/practicas/${practicaId}`),
  byEstudiante: (estudianteId: number) =>
    apiClient.get(`/practicas/estudiante/${estudianteId}`),
  asignarAsesor: (practicaId: number, body: { asesor_id: number }) =>
    apiClient.put(`/practicas/${practicaId}/asignar-asesor`, body),
  updateAdmin: (practicaId: number, body: Record<string, unknown>) =>
    apiClient.patch(`/practicas/${practicaId}/admin`, body),
  validarDocumento: (
    practicaId: number,
    documentoId: number,
    body: { validado: boolean; observaciones?: string },
  ) =>
    apiClient.put(
      `/practicas/${practicaId}/documentos/${documentoId}/validar`,
      body,
    ),
  subirPlan: (practicaId: number, body: { archivo_url: string; nombre_original?: string }) =>
    apiClient.put(`/practicas/${practicaId}/plan`, body),
  validarPlan: (practicaId: number, body: { aprobado: boolean; observaciones?: string }) =>
    apiClient.put(`/practicas/${practicaId}/plan/validar`, body),
  subirInformeFinal: (practicaId: number, body: { archivo_url: string; nombre_original?: string }) =>
    apiClient.put(`/practicas/${practicaId}/informe-final`, body),
  subirActaAsesor: (practicaId: number, body: { archivo_url: string; nombre_original?: string }) =>
    apiClient.put(`/practicas/${practicaId}/informe-final/acta`, body),
  aprobarInforme: (
    practicaId: number,
    body: { acta_aprobacion_url?: string; observaciones?: string },
  ) => apiClient.put(`/practicas/${practicaId}/informe-final/aprobar`, body),
  solicitarRevisionInforme: (practicaId: number) =>
    apiClient.put(`/practicas/${practicaId}/solicitar-revision-informe-final`, {}),
};

// Tesis
export const tesisApi = {
  getAll: (params?: any) => apiClient.get<ApiResponse<Tesis[]>>('/tesis', { params }),
  getByEstudiante: (estudianteId: number) =>
    apiClient.get<ApiResponse<Tesis[]>>(`/tesis/estudiante/${estudianteId}`),
  getOne: (id: number) => apiClient.get<ApiResponse<Tesis>>(`/tesis/${id}`),
  create: (data: any) => apiClient.post('/tesis', data),
  update: (id: number, data: any) => apiClient.put(`/tesis/${id}`, data),
  updateAdmin: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/tesis/${id}/admin`, data),
  updateEstado: (id: number, estado: string) =>
    apiClient.put(`/tesis/${id}/estado`, { estado }),
  asignarJurados: (id: number, jurados: any[]) =>
    apiClient.post(`/tesis/${id}/jurados`, jurados),
  crearActa: (id: number, data: any) => apiClient.post(`/tesis/${id}/acta`, data),
  getAvances: (id: number) => apiClient.get(`/tesis/${id}/avances`),
  registrarAvance: (id: number, data: any) => apiClient.post(`/tesis/${id}/avances`, data),
  revisarAvance: (avanceId: number, estado: string, observaciones?: string) =>
    apiClient.put(`/tesis/avances/${avanceId}/revisar`, { estado, observaciones }),
  updateAvance: (avanceId: number, data: any) =>
    apiClient.put(`/tesis/avances/${avanceId}`, data),
  getEstadisticas: () => apiClient.get('/tesis/estadisticas'),
  subirDocumento: (id: number, body: { tipo: string; archivo_url: string; nombre_original?: string; version?: number }) =>
    apiClient.post(`/tesis/${id}/documentos`, body),
  /** Cola administrativa: pagos pendientes + documentos tesis sin validar */
  secretariaColaValidacion: () =>
    apiClient.get('/tesis/secretaria/cola-validacion'),
  /** Designaciones como miembro de jurado y documentos a revisar */
  misRevisionesJurado: () => apiClient.get('/tesis/jurado/mis-revisiones'),
  solicitudPagoEstudiante: (
    id: number,
    body: { tipo: string; monto: number; observaciones?: string },
  ) => apiClient.post(`/tesis/${id}/pagos/solicitud`, body),
  validarDocumentoTesis: (
    tesisId: number,
    documentoId: number,
    body: { validado: boolean; observaciones?: string },
  ) =>
    apiClient.put(`/tesis/${tesisId}/documentos/${documentoId}/validar`, body),
  crearPago: (id: number, body: { tipo: string; monto: number; observaciones?: string }) =>
    apiClient.post(`/tesis/${id}/pagos`, body),
  cargarComprobantePago: (tesisId: number, pagoId: number, body: { comprobante_url: string; observaciones?: string }) =>
    apiClient.put(`/tesis/${tesisId}/pagos/${pagoId}/comprobante`, body),
  verificarPago: (tesisId: number, pagoId: number, body: { estado: string; observaciones?: string }) =>
    apiClient.put(`/tesis/${tesisId}/pagos/${pagoId}/verificar`, body),
  juradoObservaciones: (tesisId: number, juradoTesisId: number, body: { observaciones: string; archivo_correciones_url?: string }) =>
    apiClient.post(`/tesis/${tesisId}/jurados/${juradoTesisId}/revision/observaciones`, body),
  juradoConforme: (tesisId: number, juradoTesisId: number) =>
    apiClient.post(`/tesis/${tesisId}/jurados/${juradoTesisId}/revision/conforme`, {}),
  checklistCierre: (id: number) => apiClient.get(`/tesis/${id}/cierre/checklist`),
  validarExpedito: (id: number) => apiClient.post(`/tesis/${id}/cierre/validar-expedito`, {}),
  gateSustentacion: (id: number) => apiClient.get(`/tesis/${id}/sustentacion/gate`),
  programarSustentacion: (id: number, fecha: string) =>
    apiClient.put(`/tesis/${id}/sustentacion/programar`, { fecha }),
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

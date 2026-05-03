// ==================== ENUMS ====================
export enum RolNombre {
  admin = 'admin',
  coordinador = 'coordinador',
  asesor = 'asesor',
  estudiante = 'estudiante',
  empresa = 'empresa',
}

export enum EstadoPostulacion {
  postulado = 'postulado',
  aceptado = 'aceptado',
  rechazado = 'rechazado',
  en_curso = 'en_curso',
  finalizado = 'finalizado',
}

export enum EstadoTesis {
  propuesta = 'propuesta',
  desarrollo = 'desarrollo',
  sustentacion = 'sustentacion',
  culminado = 'culminado',
}

// ==================== MODELOS BASE ====================
export interface Usuario {
  id: number;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  roles?: UsuarioRol[];
  estudiante?: Estudiante;
  asesor?: Asesor;
  reportes?: Reporte[];
}

export interface Rol {
  id: number;
  nombre: RolNombre;
  descripcion: string | null;
  usuarios?: UsuarioRol[];
}

export interface UsuarioRol {
  usuario_id: number;
  rol_id: number;
  asignado_en: Date;
  usuario?: Usuario;
  rol?: Rol;
}

export interface Escuela {
  id: number;
  nombre: string;
  facultad: string;
  estudiantes?: Estudiante[];
  asesores?: Asesor[];
}

export interface Estudiante {
  id: number;
  usuario_id: number;
  codigo_universitario: string;
  escuela_id: number;
  ciclo: string | null;
  resolucion_practicas: string | null;
  created_at: Date;
  usuario: Usuario;
  escuela: Escuela;
  postulaciones?: Postulacion[];
  tesis?: Tesis[];
}

export interface Asesor {
  id: number;
  usuario_id: number;
  escuela_id: number;
  especialidad: string | null;
  created_at: Date;
  usuario: Usuario;
  escuela: Escuela;
  postulaciones?: AsesorPostulacion[];
  postulacionesAcademicas?: Postulacion[];
  tesisAsesorPrincipal?: Tesis[];
  juradoTesis?: JuradoTesis[];
}

export interface Empresa {
  id: number;
  ruc: string;
  razon_social: string;
  direccion: string | null;
  telefono: string | null;
  email_contacto: string | null;
  representante: string | null;
  convenio_activo: boolean;
  created_at: Date;
  convenios?: Convenio[];
  ofertas?: OfertaPractica[];
  _count?: {
    ofertas: number;
    convenios: number;
  };
}

export interface Convenio {
  id: number;
  empresa_id: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  tipo: string;
  archivo_pdf: string | null;
  estado: string;
  created_at: Date;
  empresa: Empresa;
}

export interface OfertaPractica {
  id: number;
  empresa_id: number;
  titulo: string;
  descripcion: string;
  requisitos: string | null;
  fecha_inicio: Date;
  fecha_fin: Date;
  vacantes: number;
  modalidad: string;
  estado: string;
  created_at: Date;
  empresa: Empresa;
  postulaciones?: Postulacion[];
  _count?: {
    postulaciones: number;
  };
}

export interface Postulacion {
  id: number;
  oferta_id: number;
  estudiante_id: number;
  asesor_academico_id: number | null;
  fecha_postulacion: Date;
  estado: EstadoPostulacion;
  created_at: Date;
  oferta: OfertaPractica;
  estudiante: Estudiante;
  asesor_academico?: Asesor | null;
  asesorPostulacion?: AsesorPostulacion;
  seguimiento?: SeguimientoPractica;
}

export interface AsesorPostulacion {
  id: number;
  asesor_id: number;
  postulacion_id: number;
  asignado_en: Date;
  asesor: Asesor;
  postulacion: Postulacion;
}

export interface SeguimientoPractica {
  id: number;
  postulacion_id: number;
  horas_cumplidas: number;
  horas_totales: number;
  informe_estudiante: string | null;
  informe_asesor: string | null;
  evaluacion: string;
  fecha_evaluacion: Date | null;
  created_at: Date;
  postulacion: Postulacion;
}

export interface Tesis {
  id: number;
  titulo: string;
  resumen: string | null;
  estudiante_id: number;
  asesor_principal_id: number;
  estado: EstadoTesis;
  fecha_inicio: Date | null;
  fecha_sustentacion: Date | null;
  created_at: Date;
  estudiante: Estudiante;
  asesor_principal: Asesor;
  jurados?: JuradoTesis[];
  avances?: AvanceTesis[];
  acta?: ActaSustentacion | null;
}

export interface JuradoTesis {
  id: number;
  tesis_id: number;
  asesor_id: number;
  rol: string;
  tesis: Tesis;
  asesor: Asesor;
}

export interface AvanceTesis {
  id: number;
  tesis_id: number;
  tipo: string;
  descripcion: string;
  fecha_entrega: Date;
  estado: string;
  observaciones: string | null;
  created_at: Date;
  tesis: Tesis;
}

export interface ActaSustentacion {
  id: number;
  tesis_id: number;
  fecha: Date;
  lugar: string | null;
  nota_final: number | null;
  archivo_acta_pdf: string | null;
  created_at: Date;
  tesis: Tesis;
}

export interface Reporte {
  id: number;
  tipo: string;
  parametros: any | null; // Json tipo any
  archivo_generado: Uint8Array | null; // Bytes
  generado_en: Date;
  generado_por: number | null;
  usuario?: Usuario | null;
}

// ==================== TIPOS PARA EL FRONTEND (VERSIONES SIMPLIFICADAS) ====================
export interface User {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  dni?: string;
  telefono?: string;
  roles: RolNombre[];
}

// Versión simplificada de Estudiante para el frontend
export interface EstudianteFrontend {
  id: number;
  usuario_id: number;
  codigo_universitario: string;
  escuela_id: number;
  ciclo: string | null;
  usuario: {
    nombres: string;
    apellidos: string;
    email: string;
    dni: string;
  };
  escuela: {
    nombre: string;
    facultad: string;
  };
}

// Versión simplificada de Tesis para el frontend
export interface TesisFrontend {
  id: number;
  titulo: string;
  resumen: string | null;
  estado: EstadoTesis;
  fecha_inicio: Date | string | null;
  fecha_sustentacion: Date | string | null;
  estudiante: {
    id: number;
    codigo_universitario: string;
    usuario: {
      nombres: string;
      apellidos: string;
    };
    escuela: {
      nombre: string;
      facultad: string;
    };
  };
  asesor_principal: {
    id: number;
    usuario: {
      nombres: string;
      apellidos: string;
    };
  };
  jurados?: {
    id: number;
    rol: string;
    asesor: {
      usuario: {
        nombres: string;
        apellidos: string;
      };
    };
  }[];
  avances?: {
    id: number;
    tipo: string;
    descripcion: string;
    fecha_entrega: Date | string;
    estado: string;
  }[];
  acta?: {
    id: number;
    fecha: Date | string;
    nota_final: number | null;
    archivo_acta_pdf: string | null;
  } | null;
}

// Versión simplificada de Postulacion para el frontend
export interface PostulacionFrontend {
  id: number;
  oferta_id: number;
  estudiante_id: number;
  estado: EstadoPostulacion;
  fecha_postulacion: Date | string;
  estudiante: {
    id: number;
    codigo_universitario: string;
    usuario: {
      nombres: string;
      apellidos: string;
    };
    escuela: {
      nombre: string;
    };
  };
  oferta: {
    id: number;
    titulo: string;
    empresa: {
      razon_social: string;
    };
  };
  seguimiento?: {
    id: number;
    horas_cumplidas: number;
    horas_totales: number;
    evaluacion: string;
  } | null;
  asesor_academico?: {
    id: number;
    usuario: {
      nombres: string;
      apellidos: string;
    };
  } | null;
}

// Versión simplificada de OfertaPractica para el frontend
export interface OfertaPracticaFrontend {
  id: number;
  empresa_id: number;
  titulo: string;
  descripcion: string;
  requisitos: string | null;
  fecha_inicio: Date | string;
  fecha_fin: Date | string;
  vacantes: number;
  modalidad: string;
  estado: string;
  empresa: {
    id: number;
    razon_social: string;
    ruc: string;
  };
  _count?: {
    postulaciones: number;
  };
}

// ==================== TIPOS PARA API ====================
export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardData {
  resumen: {
    total_estudiantes: number;
    total_empresas: number;
    total_ofertas_activas: number;
    total_postulaciones_activas: number;
    total_tesis_activas: number;
  };
  practicas: {
    practicas_por_estado: any[];
    estudiantes_por_escuela: any[];
    practicas_por_mes: any[];
  };
  tesis: {
    tesis_por_estado: any[];
    tesis_por_escuela: any[];
    tesis_por_anio: any[];
  };
  empresas: {
    empresas_con_convenio: number;
    empresas_sin_convenio: number;
    top_empresas_ofertas: any[];
    convenios_por_vencer: any[];
  };
  indicadores: {
    tasa_exito_practicas: string;
    tasa_culminacion_tesis: string;
    promedio_duracion_tesis_dias: number;
    total_postulaciones: number;
    postulaciones_exitosas: number;
    total_tesis: number;
    tesis_culminadas: number;
  };
}
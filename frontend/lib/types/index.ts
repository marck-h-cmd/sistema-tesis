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

export interface User {
  id: number;
  email: string;
  nombres: string;
  apellidos: string;
  roles: RolNombre[];
}

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

export interface Estudiante {
  id: number;
  usuario_id: number;
  codigo_universitario: string;
  escuela_id: number;
  ciclo: string;
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

export interface Empresa {
  id: number;
  ruc: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email_contacto: string;
  representante: string;
  convenio_activo: boolean;
  _count?: {
    ofertas: number;
    convenios: number;
  };
}

export interface OfertaPractica {
  id: number;
  empresa_id: number;
  titulo: string;
  descripcion: string;
  requisitos: string;
  fecha_inicio: string;
  fecha_fin: string;
  vacantes: number;
  modalidad: string;
  estado: string;
  empresa: {
    razon_social: string;
    ruc: string;
  };
  _count?: {
    postulaciones: number;
  };
}

export interface Postulacion {
  id: number;
  oferta_id: number;
  estudiante_id: number;
  estado: EstadoPostulacion;
  fecha_postulacion: string;
  estudiante: {
    usuario: {
      nombres: string;
      apellidos: string;
    };
    escuela: {
      nombre: string;
    };
  };
  oferta: {
    titulo: string;
    empresa: {
      razon_social: string;
    };
  };
  seguimiento?: {
    horas_cumplidas: number;
    horas_totales: number;
    evaluacion: string;
  };
}

export interface Tesis {
  id: number;
  titulo: string;
  resumen: string;
  estado: EstadoTesis;
  estudiante: {
    usuario: {
      nombres: string;
      apellidos: string;
    };
    escuela: {
      nombre: string;
    };
  };
  asesor_principal: {
    usuario: {
      nombres: string;
      apellidos: string;
    };
  };
  acta?: {
    nota_final: number;
  };
}

export interface DashboardData {
  resumen: {
    total_estudiantes: number;
    total_empresas: number;
    total_ofertas_activas: number;
    total_postulaciones_activas: number;
    total_tesis_activas: number;
  };
  practicas: any;
  tesis: any;
  empresas: any;
  indicadores: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
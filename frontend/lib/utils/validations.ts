import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[@$!%*?&]/, 'Debe contener al menos un carácter especial'),
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  dni: z.string().regex(/^\d{8}$/, 'DNI debe ser 8 dígitos'),
  telefono: z.string().optional(),
});

export const ofertaSchema = z.object({
  empresa_id: z.number(),
  titulo: z.string().min(5, 'Mínimo 5 caracteres'),
  descripcion: z.string().min(20, 'Mínimo 20 caracteres'),
  requisitos: z.string().optional(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  vacantes: z.number().min(1, 'Mínimo 1 vacante'),
  modalidad: z.enum(['presencial', 'remota', 'hibrida']),
});

export const tesisSchema = z.object({
  titulo: z.string().min(10, 'Mínimo 10 caracteres'),
  resumen: z.string().optional(),
  estudiante_id: z.number(),
  asesor_principal_id: z.number(),
  fecha_inicio: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OfertaFormData = z.infer<typeof ofertaSchema>;
export type TesisFormData = z.infer<typeof tesisSchema>;
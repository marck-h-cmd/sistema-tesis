import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValidatorFn = (value: string, allValues?: Record<string, string>) => string | null;

export type FieldRules = {
  [fieldName: string]: ValidatorFn[];
};

export type FieldErrors = {
  [fieldName: string]: string | null;
};

export type TouchedFields = {
  [fieldName: string]: boolean;
};

// ─── Built-in validators ──────────────────────────────────────────────────────

export const validators = {
  required: (label = 'Este campo'): ValidatorFn =>
    (value) => (!value || !value.trim() ? `${label} es obligatorio` : null),

  minLength: (min: number, label = 'Este campo'): ValidatorFn =>
    (value) =>
      value && value.length < min
        ? `${label} debe tener al menos ${min} caracteres`
        : null,

  maxLength: (max: number, label = 'Este campo'): ValidatorFn =>
    (value) =>
      value && value.length > max
        ? `${label} no puede superar los ${max} caracteres`
        : null,

  exactLength: (len: number, label = 'Este campo'): ValidatorFn =>
    (value) =>
      value && value.length !== len
        ? `${label} debe tener exactamente ${len} caracteres`
        : null,

  email: (): ValidatorFn =>
    (value) =>
      value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? 'Ingresa un correo electrónico válido'
        : null,

  numeric: (label = 'Este campo'): ValidatorFn =>
    (value) =>
      value && !/^\d+$/.test(value) ? `${label} solo debe contener números` : null,

  ruc: (): ValidatorFn =>
    (value) => {
      if (!value) return null;
      if (!/^\d+$/.test(value)) return 'El RUC solo debe contener números';
      if (value.length !== 11) return 'El RUC debe tener 11 dígitos';
      if (!['10', '20'].includes(value.slice(0, 2)))
        return 'El RUC debe comenzar con 10 o 20';
      return null;
    },

  dni: (): ValidatorFn =>
    (value) => {
      if (!value) return null;
      if (!/^\d+$/.test(value)) return 'El DNI solo debe contener números';
      if (value.length !== 8) return 'El DNI debe tener 8 dígitos';
      return null;
    },

  phone: (): ValidatorFn =>
    (value) => {
      if (!value) return null;
      if (!/^\d{9}$/.test(value)) return 'El teléfono debe tener 9 dígitos';
      return null;
    },

  minValue: (min: number, label = 'Este campo'): ValidatorFn =>
    (value) =>
      value && Number(value) < min ? `${label} debe ser al menos ${min}` : null,

  dateNotPast: (label = 'La fecha'): ValidatorFn =>
    (value) => {
      if (!value) return null;
      const selected = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected < today ? `${label} no puede ser una fecha pasada` : null;
    },

  dateAfter:
    (otherField: string, otherLabel = 'la fecha de inicio', label = 'La fecha de fin'): ValidatorFn =>
    (value, allValues) => {
      if (!value || !allValues?.[otherField]) return null;
      const a = new Date(allValues[otherField]);
      const b = new Date(value);
      return b <= a ? `${label} debe ser posterior a ${otherLabel}` : null;
    },

  matchField:
    (otherField: string, label = 'Las contraseñas'): ValidatorFn =>
    (value, allValues) => {
      if (!value) return null;
      return value !== allValues?.[otherField] ? `${label} no coinciden` : null;
    },

  password: (): ValidatorFn =>
    (value) => {
      if (!value) return null;
      if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      if (!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
      if (!/[0-9]/.test(value)) return 'Debe contener al menos un número';
      return null;
    },
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFormValidation<T extends Record<string, string>>(
  rules: FieldRules,
) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  /** Validate a single field immediately */
  const validateField = useCallback(
    (name: string, value: string, allValues: Record<string, string> = {}): string | null => {
      const fieldRules = rules[name];
      if (!fieldRules) return null;
      for (const rule of fieldRules) {
        const error = rule(value, allValues);
        if (error) return error;
      }
      return null;
    },
    [rules],
  );

  /** Called on every change — validates only if field was already touched */
  const handleChange = useCallback(
    (name: string, value: string, allValues: Record<string, string> = {}) => {
      if (touched[name]) {
        const error = validateField(name, value, allValues);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField],
  );

  /** Called on blur — marks field as touched and validates */
  const handleBlur = useCallback(
    (name: string, value: string, allValues: Record<string, string> = {}) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value, allValues);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField],
  );

  /** Validate ALL fields at once (used on submit) */
  const validateAll = useCallback(
    (allValues: Record<string, string>): boolean => {
      const newErrors: FieldErrors = {};
      const newTouched: TouchedFields = {};
      let isValid = true;

      for (const name of Object.keys(rules)) {
        newTouched[name] = true;
        const error = validateField(name, allValues[name] ?? '', allValues);
        newErrors[name] = error;
        if (error) isValid = false;
      }

      setErrors(newErrors);
      setTouched(newTouched);
      return isValid;
    },
    [rules, validateField],
  );

  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  /** Helper: returns error only for touched fields */
  const getFieldError = useCallback(
    (name: string): string | null => (touched[name] ? errors[name] ?? null : null),
    [errors, touched],
  );

  const isFieldValid = useCallback(
    (name: string, value: string): boolean => touched[name] && !validateField(name, value),
    [touched, validateField],
  );

  return {
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetValidation,
    getFieldError,
    isFieldValid,
  };
}
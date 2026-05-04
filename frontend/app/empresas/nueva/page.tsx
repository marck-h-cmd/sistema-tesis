'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { empresasApi } from '@/lib/api/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useFormValidation, validators } from '@/lib/hooks/useFormValidation';
import { FieldWrapper } from '@/components/ui/FieldWrapper';

// ─── Validation rules ─────────────────────────────────────────────────────────

const rules = {
  ruc: [validators.required('El RUC'), validators.ruc()],
  razon_social: [
    validators.required('La razón social'),
    validators.minLength(3, 'La razón social'),
    validators.maxLength(150, 'La razón social'),
  ],
  direccion: [validators.maxLength(200, 'La dirección')],
  telefono: [validators.phone()],
  email_contacto: [validators.email()],
  representante: [validators.maxLength(100, 'El representante')],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NuevaEmpresaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    direccion: '',
    telefono: '',
    email_contacto: '',
    representante: '',
    convenio_activo: false,
  });

  const { handleChange, handleBlur, validateAll, getFieldError, isFieldValid } =
    useFormValidation(rules);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const stringValues = () =>
    Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, String(v)]),
    );

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (type !== 'checkbox') {
      handleChange(name, value, { ...stringValues(), [name]: value });
    }
  };

  const onFieldBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type !== 'checkbox') {
      handleBlur(name, value, stringValues());
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll(stringValues())) return;

    setIsLoading(true);
    try {
      await empresasApi.create(formData);
      toast.success('Empresa registrada exitosamente');
      router.push('/empresas');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar empresa');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <Link
        href="/empresas"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a empresas
      </Link>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nueva Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">

              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="RUC"
                  required
                  error={getFieldError('ruc')}
                  success={isFieldValid('ruc', formData.ruc)}
                  hint="11 dígitos (10... personal / 20... jurídica)"
                >
                  <Input
                    name="ruc"
                    value={formData.ruc}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    maxLength={11}
                    placeholder="20123456789"
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Razón Social"
                  required
                  error={getFieldError('razon_social')}
                  success={isFieldValid('razon_social', formData.razon_social)}
                >
                  <Input
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    placeholder="Empresa XYZ S.A.C."
                  />
                </FieldWrapper>
              </div>

              <FieldWrapper
                label="Dirección"
                error={getFieldError('direccion')}
                success={isFieldValid('direccion', formData.direccion)}
              >
                <Input
                  name="direccion"
                  value={formData.direccion}
                  onChange={onFieldChange}
                  onBlur={onFieldBlur}
                  placeholder="Av. Principal 123"
                />
              </FieldWrapper>

              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="Teléfono"
                  error={getFieldError('telefono')}
                  success={isFieldValid('telefono', formData.telefono)}
                  hint="9 dígitos (opcional)"
                >
                  <Input
                    name="telefono"
                    value={formData.telefono}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    maxLength={9}
                    placeholder="999888777"
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Email de contacto"
                  error={getFieldError('email_contacto')}
                  success={isFieldValid('email_contacto', formData.email_contacto)}
                >
                  <Input
                    name="email_contacto"
                    type="email"
                    value={formData.email_contacto}
                    onChange={onFieldChange}
                    onBlur={onFieldBlur}
                    placeholder="contacto@empresa.com"
                  />
                </FieldWrapper>
              </div>

              <FieldWrapper
                label="Representante"
                error={getFieldError('representante')}
                success={isFieldValid('representante', formData.representante)}
              >
                <Input
                  name="representante"
                  value={formData.representante}
                  onChange={onFieldChange}
                  onBlur={onFieldBlur}
                  placeholder="Nombre del representante"
                />
              </FieldWrapper>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="convenio_activo"
                  id="convenio_activo"
                  checked={formData.convenio_activo}
                  onChange={onFieldChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="convenio_activo" className="text-sm font-medium">
                  Tiene convenio activo
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/empresas">
                  <Button type="button" variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Registrar Empresa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
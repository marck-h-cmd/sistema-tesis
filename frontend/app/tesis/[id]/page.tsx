'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportesApi, tesisApi, asesoresApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/lib/utils/formatDate';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  User,
  School,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Loader2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AvanceEditForm } from '@/components/forms/AvanceEditForm';

const estadosTesis: Record<string, { color: string; label: string }> = {
  propuesta: { color: 'bg-blue-100 text-blue-800', label: 'Propuesta' },
  desarrollo: { color: 'bg-yellow-100 text-yellow-800', label: 'En desarrollo' },
  en_revision: { color: 'bg-amber-100 text-amber-900', label: 'En revisión (jurado)' },
  observaciones_emitidas: { color: 'bg-orange-100 text-orange-900', label: 'Observaciones del jurado' },
  observaciones_levantadas: { color: 'bg-cyan-100 text-cyan-900', label: 'Correcciones cargadas' },
  aprobado_jurado: { color: 'bg-indigo-100 text-indigo-900', label: 'Aprobado por jurado' },
  expedito: { color: 'bg-emerald-100 text-emerald-900', label: 'Expedito' },
  sustentacion_programada: { color: 'bg-purple-100 text-purple-900', label: 'Sustentación programada' },
  sustentado: { color: 'bg-violet-100 text-violet-900', label: 'Sustentado' },
  culminado: { color: 'bg-green-100 text-green-800', label: 'Culminado' },
};

const DOC_TIPOS = [
  { value: 'tesis_final', label: 'Tesis final' },
  { value: 'anexos', label: 'Anexos' },
  { value: 'version_corregida', label: 'Versión corregida (jurado)' },
  { value: 'recibo_turnitin', label: 'Recibo Turnitin' },
  { value: 'comprobante_pago', label: 'Comprobante pago' },
  { value: 'carta_conformidad_jurado', label: 'Carta conformidad jurado' },
];

const PAGO_TIPOS = [
  { value: 'turnitin', label: 'Turnitin' },
  { value: 'carpeta_tesis', label: 'Carpeta tesis' },
  { value: 'derecho_sustentacion', label: 'Derecho sustentación' },
];

export default function TesisDetailPage() {
  const { id } = useParams();
  const tesisId = Number(id);
  const qc = useQueryClient();
  const { hasRole, user } = useAuth();

  const [isViewingPdf, setIsViewingPdf] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [reviewingAvance, setReviewingAvance] = useState<any>(null);
  const [reviewObservaciones, setReviewObservaciones] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [editingAvance, setEditingAvance] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openActaModal, setOpenActaModal] = useState(false);
  const [selectedAsesorId, setSelectedAsesorId] = useState<number | null>(null);
  const [selectedJuradoRole, setSelectedJuradoRole] = useState('');
  const [isAssigningJurado, setIsAssigningJurado] = useState(false);
  const [actaFecha, setActaFecha] = useState('');
  const [actaLugar, setActaLugar] = useState('');
  const [actaNota, setActaNota] = useState<number | ''>('');
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [isCreatingActa, setIsCreatingActa] = useState(false);

  const [docTipo, setDocTipo] = useState('tesis_final');
  const [docUrl, setDocUrl] = useState('');
  const [nuevoPagoTipo, setNuevoPagoTipo] = useState('turnitin');
  const [nuevoPagoMonto, setNuevoPagoMonto] = useState('87');
  const [nuevoPagoObs, setNuevoPagoObs] = useState('');
  const [docValidacionObs, setDocValidacionObs] = useState<Record<number, string>>({});
  const [comprobanteByPago, setComprobanteByPago] = useState<Record<number, string>>({});
  const [fechaSustentacion, setFechaSustentacion] = useState('');
  const [juradoObsById, setJuradoObsById] = useState<Record<number, string>>({});

  const { data: tesis, isLoading, refetch } = useQuery({
    queryKey: ['tesis', id],
    queryFn: () => tesisApi.getOne(tesisId).then((res) => res.data.data),
  });

  const { data: asesores } = useQuery({
    queryKey: ['asesores'],
    queryFn: () => asesoresApi.getAll().then((res) => res.data.data),
    enabled: hasRole('admin') || hasRole('coordinador') || hasRole('asesor'),
  });

  const { data: gate } = useQuery({
    queryKey: ['tesis-gate', tesisId],
    queryFn: () => tesisApi.gateSustentacion(tesisId).then((r) => r.data.data),
    enabled: !!tesisId && !Number.isNaN(tesisId) && !!tesis,
  });

  const { data: checklist } = useQuery({
    queryKey: ['tesis-checklist', tesisId],
    queryFn: () => tesisApi.checklistCierre(tesisId).then((r) => r.data.data),
    enabled:
      !!tesis &&
      (hasRole('admin') || hasRole('coordinador') || hasRole('secretaria')),
  });

  const esEstudianteTesista =
    hasRole('estudiante') && user?.id === tesis?.estudiante?.usuario?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!tesis) {
    return <p className="text-center py-12 text-gray-500">Tesis no encontrada</p>;
  }

  const estadoConfig = estadosTesis[tesis.estado] || {
    color: 'bg-gray-100 text-gray-800',
    label: String(tesis.estado),
  };

  const availableAsesores = (asesores || []).filter(
    (asesor: any) =>
      asesor.id !== tesis.asesor_principal_id &&
      !tesis.jurados?.some((jurado: any) => jurado.asesor_id === asesor.id),
  );

  const juradoCount = tesis.jurados?.length ?? 0;

  const handleVerDocumento = async () => {
    if (!tesisId || Number.isNaN(tesisId)) return;
    try {
      setIsViewingPdf(true);
      const response = await reportesApi.verDocumentoTesis(tesisId);
      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      alert('No se pudo generar el documento PDF');
    } finally {
      setIsViewingPdf(false);
    }
  };

  const handleDescargarInforme = async () => {
    if (!tesisId || Number.isNaN(tesisId)) return;
    try {
      setIsDownloadingPdf(true);
      const response = await reportesApi.descargarInformeTesis(tesisId);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-tesis-${tesisId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo descargar el informe PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAssignJurado = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('selectedAsesorId', selectedAsesorId);
    if (!selectedAsesorId || !selectedJuradoRole) {
      toast.error('Selecciona un asesor y un rol para el jurado');
      return;
    }
    setIsAssigningJurado(true);
    try {
      await tesisApi.asignarJurados(tesisId, [{ asesor_id: selectedAsesorId, rol: selectedJuradoRole }]);
      toast.success('Jurado asignado');
      setOpenAssignModal(false);
      setSelectedAsesorId(null);
      setSelectedJuradoRole('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al asignar jurado');
    } finally {
      setIsAssigningJurado(false);
    }
  };

  const handleCrearActa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!actaFecha) {
      toast.error('La fecha es obligatoria');
      return;
    }
    if (!actaFile) {
      toast.error('Selecciona el PDF del acta');
      return;
    }
    setIsCreatingActa(true);
    try {
      const archivo_acta_pdf = await readFileAsBase64(actaFile);
      await tesisApi.crearActa(tesisId, {
        fecha: actaFecha,
        lugar: actaLugar || undefined,
        nota_final: actaNota ? Number(actaNota) : undefined,
        archivo_acta_pdf,
      });
      toast.success('Acta registrada');
      setOpenActaModal(false);
      setActaFecha('');
      setActaLugar('');
      setActaNota('');
      setActaFile(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al crear acta');
    } finally {
      setIsCreatingActa(false);
    }
  };

  const handleDownloadActaPdf = () => {
    if (!tesis.acta?.archivo_acta_pdf) return;
    const rawData = tesis.acta.archivo_acta_pdf.includes('base64,')
      ? tesis.acta.archivo_acta_pdf.split('base64,')[1]
      : tesis.acta.archivo_acta_pdf;
    const binary = atob(rawData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acta-sustentacion-tesis-${tesisId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleRevisarAvance = async (avanceId: number, estado: string) => {
    if (!reviewingAvance) return;
    setIsReviewing(true);
    try {
      await tesisApi.revisarAvance(avanceId, estado, reviewObservaciones || undefined);
      toast.success('Avance actualizado');
      setReviewingAvance(null);
      setReviewObservaciones('');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error');
    } finally {
      setIsReviewing(false);
    }
  };

  const openReviewModal = (avance: any) => {
    setReviewingAvance(avance);
    setReviewObservaciones(avance.observaciones || '');
  };
  const closeReviewModal = () => {
    setReviewingAvance(null);
    setReviewObservaciones('');
  };

  const handleEditarAvance = async (data: any) => {
    if (!editingAvance) return;
    console.log('data', data);
    setIsEditing(true);
    try {
      await tesisApi.updateAvance(editingAvance.id, data);
      toast.success('Avance actualizado');
      setEditingAvance(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error');
      throw error;
    } finally {
      setIsEditing(false);
    }
  };

  const subirDocumento = async () => {
    if (!docUrl.trim()) {
      toast.error('Indica la URL del archivo');
      return;
    }
    try {
      await tesisApi.subirDocumento(tesisId, { tipo: docTipo, archivo_url: docUrl.trim() });
      toast.success('Documento registrado');
      setDocUrl('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const crearPago = async () => {
    try {
      await tesisApi.crearPago(tesisId, {
        tipo: nuevoPagoTipo,
        monto: Number(nuevoPagoMonto),
        ...(nuevoPagoObs.trim() ? { observaciones: nuevoPagoObs.trim() } : {}),
      });
      toast.success('Pago registrado');
      setNuevoPagoObs('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const solicitudPagoEstudiante = async () => {
    const monto = Number(nuevoPagoMonto);
    if (!monto || monto <= 0) {
      toast.error('Indique un monto válido');
      return;
    }
    try {
      await tesisApi.solicitudPagoEstudiante(tesisId, {
        tipo: nuevoPagoTipo,
        monto,
        ...(nuevoPagoObs.trim() ? { observaciones: nuevoPagoObs.trim() } : {}),
      });
      toast.success('Solicitud de pago registrada');
      setNuevoPagoObs('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const validarDocumentoTesisStaff = async (documentoId: number, validado: boolean) => {
    try {
      await tesisApi.validarDocumentoTesis(tesisId, documentoId, {
        validado,
        observaciones: docValidacionObs[documentoId]?.trim() || undefined,
      });
      toast.success('Documento actualizado');
      setDocValidacionObs((s) => ({ ...s, [documentoId]: '' }));
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const cargarComprobante = async (pagoId: number) => {
    const url = comprobanteByPago[pagoId]?.trim();
    if (!url) {
      toast.error('URL del comprobante requerida');
      return;
    }
    try {
      await tesisApi.cargarComprobantePago(tesisId, pagoId, { comprobante_url: url });
      toast.success('Comprobante cargado');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const verificarPago = async (pagoId: number, estado: string) => {
    try {
      await tesisApi.verificarPago(tesisId, pagoId, { estado });
      toast.success('Pago actualizado');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const enviarObsJurado = async (juradoTesisId: number) => {
    const obs = juradoObsById[juradoTesisId]?.trim();
    if (!obs) {
      toast.error('Escriba observaciones');
      return;
    }
    try {
      await tesisApi.juradoObservaciones(tesisId, juradoTesisId, { observaciones: obs });
      toast.success('Observaciones enviadas al tesista');
      setJuradoObsById((s) => ({ ...s, [juradoTesisId]: '' }));
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const marcarConforme = async (juradoTesisId: number) => {
    try {
      await tesisApi.juradoConforme(tesisId, juradoTesisId);
      toast.success('Conformidad registrada');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const validarExpedito = async () => {
    try {
      await tesisApi.validarExpedito(tesisId);
      toast.success('Tesis marcada como expedito');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-gate', tesisId] });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      const motivos = e?.response?.data?.motivos;
      toast.error(msg || 'No se cumplen los requisitos');
      if (motivos?.length) console.warn(motivos);
    }
  };

  const programarSustentacion = async () => {
    if (!fechaSustentacion) {
      toast.error('Seleccione fecha');
      return;
    }
    try {
      await tesisApi.programarSustentacion(tesisId, new Date(fechaSustentacion).toISOString());
      toast.success('Fecha programada');
      setFechaSustentacion('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-gate', tesisId] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error');
    }
  };

  const puedeGestionarJurado = hasRole('admin') || hasRole('coordinador');
  /** Crear obligación de pago, verificar comprobantes, validar documentos de la tesis */
  const puedeGestionAdministrativaPagosDocs =
    hasRole('admin') || hasRole('coordinador') || hasRole('secretaria');
  const puedeProgramar =
    hasRole('admin') || hasRole('coordinador') || hasRole('secretaria');

  return (
    <div>
      <Link href="/tesis" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a tesis
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-2xl">{tesis.titulo}</CardTitle>
                <Badge className={estadoConfig.color}>{estadoConfig.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {tesis.resumen && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Resumen</h3>
                  <p className="text-gray-700">{tesis.resumen}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Estudiante</p>
                    <p className="font-medium">
                      {tesis.estudiante?.usuario?.nombres} {tesis.estudiante?.usuario?.apellidos}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Asesor</p>
                    <p className="font-medium">
                      {tesis.asesor_principal?.usuario?.nombres} {tesis.asesor_principal?.usuario?.apellidos}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <School className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Escuela</p>
                    <p className="font-medium">{tesis.estudiante?.escuela?.nombre}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Fecha de inicio</p>
                    <p className="font-medium">{tesis.fecha_inicio ? formatDate(tesis.fecha_inicio) : '—'}</p>
                  </div>
                </div>
              </div>
              {tesis.fecha_recepcion_documentos && (
                <p className="text-sm mt-4 text-muted-foreground">
                  <strong>Fecha de recepción documentos:</strong>{' '}
                  {formatDate(tesis.fecha_recepcion_documentos)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Documentos repositorio */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos de la tesis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Registre URLs de archivos (PDF/Drive). La primera tesis final estampa la fecha de recepción.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(tesis.documentos) && tesis.documentos.length > 0 && (
                <ul className="text-sm space-y-3 border rounded-md p-3 bg-muted/30">
                  {tesis.documentos.map((d: any) => (
                    <li key={d.id} className="flex flex-col gap-2 border-b last:border-b-0 pb-3 last:pb-0">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="capitalize font-medium">{d.tipo.replace(/_/g, ' ')} v{d.version}</span>
                        {d.validado ? (
                          <Badge className="bg-green-100 text-green-900">Validado admin.</Badge>
                        ) : (
                          <Badge variant="secondary">Pendiente validación</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <a href={d.archivo_url} className="text-primary underline truncate max-w-[240px]" target="_blank" rel="noreferrer">
                          enlace
                        </a>
                        <span className="text-muted-foreground whitespace-nowrap">{formatDate(d.subido_en)}</span>
                      </div>
                      {puedeGestionAdministrativaPagosDocs && !d.validado && (
                        <div className="space-y-2 pt-2">
                          <Textarea
                            placeholder="Observación secretaría..."
                            rows={2}
                            value={docValidacionObs[d.id] ?? ''}
                            onChange={(e) =>
                              setDocValidacionObs((s) => ({ ...s, [d.id]: e.target.value }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => validarDocumentoTesisStaff(d.id, true)}
                            >
                              Marcar documento válido
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => validarDocumentoTesisStaff(d.id, false)}
                            >
                              Observar
                            </Button>
                          </div>
                        </div>
                      )}
                      {puedeGestionAdministrativaPagosDocs && d.observaciones && (
                        <p className="text-xs text-muted-foreground">{d.observaciones}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {esEstudianteTesista && (
                <div className="flex flex-col sm:flex-row gap-2 items-end">
                  <div className="flex-1 space-y-1 w-full">
                    <Label>Tipo</Label>
                    <Select
                      className="w-full"
                      value={docTipo}
                      options={DOC_TIPOS}
                      onChange={(e) => setDocTipo(e.target.value)}
                    />
                  </div>
                  <div className="flex-[2] space-y-1 w-full">
                    <Label>URL del archivo</Label>
                    <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <Button type="button" onClick={subirDocumento}>
                    Subir registro
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos y comprobantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {puedeGestionAdministrativaPagosDocs && (
                <div className="flex flex-wrap gap-2 items-end border-b pb-4">
                  <div>
                    <Label>Concepto</Label>
                    <Select
                      className="w-44"
                      value={nuevoPagoTipo}
                      options={PAGO_TIPOS}
                      onChange={(e) => setNuevoPagoTipo(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Monto (S/)</Label>
                    <Input className="w-28" value={nuevoPagoMonto} onChange={(e) => setNuevoPagoMonto(e.target.value)} />
                  </div>
                  <div className="w-full md:w-auto md:min-w-[200px]">
                    <Label>Nota (opcional)</Label>
                    <Input value={nuevoPagoObs} onChange={(e) => setNuevoPagoObs(e.target.value)} placeholder="Referencia..." />
                  </div>
                  <Button type="button" variant="secondary" onClick={crearPago}>
                    Registrar obligación de pago
                  </Button>
                </div>
              )}
              {esEstudianteTesista && !puedeGestionAdministrativaPagosDocs && (
                <div className="flex flex-wrap gap-2 items-end border-b pb-4">
                  <div>
                    <Label>Solicitar pago — concepto</Label>
                    <Select
                      className="w-44"
                      value={nuevoPagoTipo}
                      options={PAGO_TIPOS}
                      onChange={(e) => setNuevoPagoTipo(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Monto declarado (S/)</Label>
                    <Input className="w-28" value={nuevoPagoMonto} onChange={(e) => setNuevoPagoMonto(e.target.value)} />
                  </div>
                  <div className="w-full md:w-auto md:flex-1 md:min-w-[220px]">
                    <Label>Comentario (opcional)</Label>
                    <Input value={nuevoPagoObs} onChange={(e) => setNuevoPagoObs(e.target.value)} placeholder="Ej. voucher bancario a nombre..." />
                  </div>
                  <Button type="button" onClick={solicitudPagoEstudiante}>
                    Registrar solicitud de pago
                  </Button>
                  <p className="text-xs text-muted-foreground w-full">
                    La secretaría registrará la obligación y podrá verificar su comprobante cuando lo cargue.
                  </p>
                </div>
              )}
              {Array.isArray(tesis.pagos) && tesis.pagos.length > 0 ? (
                <ul className="space-y-3">
                  {tesis.pagos.map((p: any) => (
                    <li key={p.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex justify-between flex-wrap gap-2">
                        <span className="font-medium capitalize">{p.tipo.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">S/ {p.monto}</Badge>
                        <Badge>{p.estado}</Badge>
                      </div>
                      {esEstudianteTesista && (p.estado === 'pendiente' || p.estado === 'comprobante_cargado') && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="URL comprobante"
                            value={comprobanteByPago[p.id] ?? ''}
                            onChange={(e) =>
                              setComprobanteByPago((s) => ({ ...s, [p.id]: e.target.value }))
                            }
                          />
                          <Button size="sm" type="button" onClick={() => cargarComprobante(p.id)}>
                            Cargar voucher
                          </Button>
                        </div>
                      )}
                      {puedeGestionAdministrativaPagosDocs && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            type="button"
                            disabled={
                              (p.estado === 'pendiente' && !p.comprobante_url) ||
                              p.estado === 'verificado'
                            }
                            onClick={() => verificarPago(p.id, 'verificado')}
                          >
                            Marcar pagado
                          </Button>
                          <Button size="sm" variant="outline" type="button" onClick={() => verificarPago(p.id, 'rechazado')}>
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
              )}
            </CardContent>
          </Card>

          {/* Jurados */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <CardTitle>Jurado ({juradoCount}/3)</CardTitle>
                {puedeGestionarJurado && (
                  <Button size="sm" variant="secondary" onClick={() => setOpenAssignModal(true)}>
                    Asignar miembro
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Con 3 jurados asignados puede iniciarse la revisión formal. Cada jurado registra observaciones o conformidad.
              </p>
            </CardHeader>
            <CardContent>
              {Array.isArray(tesis.jurados) && tesis.jurados.length > 0 ? (
                <div className="space-y-4">
                  {tesis.jurados.map((jurado: any) => {
                    const rev = jurado.revisiones?.[0];
                    const esMiJurado = user?.id === jurado.asesor?.usuario?.id && hasRole('asesor');
                    return (
                      <div key={jurado.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-medium">
                              {jurado.asesor.usuario.nombres} {jurado.asesor.usuario.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">{jurado.rol}</p>
                          </div>
                          {rev && (
                            <Badge variant="outline">
                              {rev.conforme ? 'Conforme' : rev.estado}
                            </Badge>
                          )}
                        </div>
                        {rev?.observaciones && (
                          <p className="text-sm bg-amber-50 p-2 rounded">{rev.observaciones}</p>
                        )}
                        {esMiJurado && juradoCount >= 3 && (
                          <div className="space-y-2 pt-2 border-t">
                            <Textarea
                              placeholder="Observaciones para el tesista"
                              value={juradoObsById[jurado.id] ?? ''}
                              onChange={(e) =>
                                setJuradoObsById((s) => ({ ...s, [jurado.id]: e.target.value }))
                              }
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                type="button"
                                onClick={() => enviarObsJurado(jurado.id)}
                              >
                                Enviar observaciones
                              </Button>
                              <Button size="sm" variant="secondary" type="button" onClick={() => marcarConforme(jurado.id)}>
                                Marcar conforme
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no hay jurados designados.</p>
              )}
            </CardContent>
          </Card>

          {/* Cierre / checklist */}
          {(hasRole('admin') || hasRole('coordinador') || hasRole('secretaria')) && checklist && (
            <Card>
              <CardHeader>
                <CardTitle>Validación final (cierre)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>Prácticas OK: {checklist.detalle?.practicas_ok ? 'Sí' : 'No'}</div>
                  <div>Jurado OK: {checklist.detalle?.jurado_ok ? 'Sí' : 'No'}</div>
                  <div>Documento final: {checklist.detalle?.documento_final_ok ? 'Sí' : 'No'}</div>
                  <div>Pagos verificados: {checklist.detalle?.pagos_ok ? 'Sí' : 'No'}</div>
                </div>
                {!checklist.completo && checklist.motivos?.length > 0 && (
                  <ul className="list-disc pl-5 text-amber-800">
                    {checklist.motivos.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
                {(hasRole('admin') || hasRole('coordinador')) && (
                  <Button type="button" disabled={tesis.estado === 'expedito'} onClick={validarExpedito}>
                    Marcar tesis como expedito
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {Array.isArray(tesis.avances) && tesis.avances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Avances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tesis.avances.map((avance: any) => (
                    <div key={avance.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium capitalize">{avance.tipo}</p>
                          <p className="text-sm text-gray-600 mt-1">{avance.descripcion}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Entregado: {formatDate(avance.fecha_entrega)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              avance.estado === 'aprobado'
                                ? 'bg-green-100 text-green-800'
                                : avance.estado === 'observado'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {avance.estado}
                          </Badge>
                          {(hasRole('admin') || hasRole('asesor') || hasRole('coordinador')) && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openReviewModal(avance)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingAvance(avance)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {avance.observaciones && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">{avance.observaciones}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {tesis.acta && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Acta de sustentación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(tesis.acta.fecha)}</p>
                </div>
                {tesis.acta.lugar && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lugar</p>
                    <p className="font-medium">{tesis.acta.lugar}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Nota final</p>
                  <p className="text-3xl font-bold text-primary">{tesis.acta.nota_final}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Sustentación</h3>
              {gate && (
                <div
                  className={`text-sm p-3 rounded-md ${gate.permitido ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}
                >
                  {gate.permitido ? (
                    <p>Puede programarse la fecha (prácticas aprobadas y tesis expedito).</p>
                  ) : (
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Aún no habilitado
                      </p>
                      <ul className="list-disc pl-5 mt-1">
                        {gate.motivos?.map((m: string, i: number) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {puedeProgramar && (
                <div className="space-y-2">
                  <Label>Fecha de sustentación</Label>
                  <Input
                    type="date"
                    value={fechaSustentacion}
                    onChange={(e) => setFechaSustentacion(e.target.value)}
                    disabled={!gate?.permitido}
                  />
                  <Button className="w-full" disabled={!gate?.permitido} onClick={programarSustentacion}>
                    Programar fecha
                  </Button>
                </div>
              )}
              {esEstudianteTesista && (
                <p className="text-xs text-muted-foreground">
                  La solicitud de fecha queda bloqueada hasta que prácticas estén aprobadas y la tesis en estado expedito.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Acciones</h3>
              <div className="space-y-2">
                {hasRole('estudiante') && (
                  <Link href={`/tesis/${tesisId}/avances`} className="w-full block">
                    <Button className="w-full" variant="secondary">
                      Registrar avance
                    </Button>
                  </Link>
                )}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleVerDocumento}
                  disabled={isViewingPdf || isDownloadingPdf}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver documento (reporte)
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleDescargarInforme}
                  disabled={isViewingPdf || isDownloadingPdf}
                >
                  Descargar informe
                </Button>
                {puedeGestionarJurado && (
                  <Button className="w-full" variant="secondary" onClick={() => setOpenAssignModal(true)}>
                    Asignar jurado
                  </Button>
                )}
                {puedeGestionarJurado &&
                  tesis.estado === 'sustentacion_programada' &&
                  !tesis.acta && (
                    <Button className="w-full" variant="secondary" onClick={() => setOpenActaModal(true)}>
                      Crear acta de sustentación
                    </Button>
                  )}
                {tesis.acta?.archivo_acta_pdf && (
                  <Button className="w-full" variant="outline" onClick={handleDownloadActaPdf}>
                    Descargar acta PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!reviewingAvance} onClose={closeReviewModal} title="Revisar avance">
        {reviewingAvance && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium capitalize">{reviewingAvance.tipo}</h4>
              <p className="text-sm text-gray-600 mt-1">{reviewingAvance.descripcion}</p>
            </div>
            <Textarea
              value={reviewObservaciones}
              onChange={(e) => setReviewObservaciones(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeReviewModal} disabled={isReviewing}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => handleRevisarAvance(reviewingAvance.id, 'observado')} disabled={isReviewing}>
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              <Button onClick={() => handleRevisarAvance(reviewingAvance.id, 'aprobado')} disabled={isReviewing}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} title="Asignar jurado">
        <form onSubmit={handleAssignJurado} className="space-y-4">
          <p className="text-sm text-muted-foreground">Asigne 3 docentes con roles distintos (presidente, secretario, vocal).</p>
          <div className="space-y-2">
            <Label>Asesor / docente</Label>
            <Select
              className="w-full"
              value={selectedAsesorId ? String(selectedAsesorId) : ''}
              options={
                availableAsesores.length > 0
                  ? availableAsesores.map((a: any) => ({
                      value: String(a.id),
                      label: `${a.usuario.nombres} ${a.usuario.apellidos}`,
                    }))
                  : [{ value: '', label: 'No hay disponibles' }]
              }
              onChange={(e) => setSelectedAsesorId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select
              className="w-full"
              value={selectedJuradoRole}
              options={[
                { value: '', label: 'Elegir' },
                { value: 'presidente', label: 'Presidente' },
                { value: 'secretario', label: 'Secretario' },
                { value: 'vocal', label: 'Vocal' },
              ]}
              onChange={(e) => setSelectedJuradoRole(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpenAssignModal(false)} disabled={isAssigningJurado}>
              Cerrar
            </Button>
            <Button type="submit" disabled={isAssigningJurado}>
              {isAssigningJurado ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={openActaModal} onClose={() => setOpenActaModal(false)} title="Acta de sustentación">
        <form onSubmit={handleCrearActa} className="space-y-4">
          <Input type="date" value={actaFecha} onChange={(e) => setActaFecha(e.target.value)} />
          <Input placeholder="Lugar" value={actaLugar} onChange={(e) => setActaLugar(e.target.value)} />
          <Input
            type="number"
            placeholder="Nota"
            value={actaNota}
            onChange={(e) => setActaNota(e.target.value ? Number(e.target.value) : '')}
          />
          <Input type="file" accept="application/pdf" onChange={(e) => setActaFile(e.target.files?.[0] || null)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpenActaModal(false)} disabled={isCreatingActa}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreatingActa}>
              {isCreatingActa ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!editingAvance} onClose={() => setEditingAvance(null)} title="Editar avance">
        {editingAvance && (
          <AvanceEditForm
            initialData={{
              tipo: editingAvance.tipo,
              descripcion: editingAvance.descripcion,
              fecha_entrega: editingAvance.fecha_entrega.split('T')[0],
              estado: editingAvance.estado as 'entregado' | 'aprobado' | 'observado',
              observaciones: editingAvance.observaciones || '',
            }}
            onSubmit={handleEditarAvance}
            isLoading={isEditing}
          />
        )}
      </Dialog>
    </div>
  );
}

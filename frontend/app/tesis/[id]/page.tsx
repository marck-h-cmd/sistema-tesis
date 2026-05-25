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
  GraduationCap,
  CircleDollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  PlusCircle,
  CalendarClock,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AvanceEditForm } from '@/components/forms/AvanceEditForm';

const estadosTesis: Record<string, { color: string; label: string }> = {
  propuesta: { color: 'bg-blue-50 text-blue-700 border-blue-200/80', label: 'Propuesta' },
  desarrollo: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200/80', label: 'En desarrollo' },
  en_revision: { color: 'bg-amber-50 text-amber-800 border-amber-200/80', label: 'En revisión (jurado)' },
  observaciones_emitidas: { color: 'bg-orange-50 text-orange-800 border-orange-200/80', label: 'Observaciones del jurado' },
  observaciones_levantadas: { color: 'bg-cyan-50 text-cyan-800 border-cyan-200/80', label: 'Correcciones cargadas' },
  aprobado_jurado: { color: 'bg-indigo-50 text-indigo-800 border-indigo-200/80', label: 'Aprobado por jurado' },
  expedito: { color: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', label: 'Expedito' },
  sustentacion_programada: { color: 'bg-purple-50 text-purple-800 border-purple-200/80', label: 'Sustentación programada' },
  sustentado: { color: 'bg-violet-50 text-violet-800 border-violet-200/80', label: 'Sustentado' },
  culminado: { color: 'bg-green-50 text-green-800 border-green-200/80', label: 'Culminado' },
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

const PAGO_LABELS: Record<string, string> = {
  turnitin: 'Turnitin',
  carpeta_tesis: 'Carpeta tesis',
  derecho_sustentacion: 'Derecho sustentación',
};

const PAGO_ESTADO_CONFIG: Record<string, { color: string; label: string }> = {
  pendiente: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendiente' },
  comprobante_cargado: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Verificación pendiente' },
  verificado: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Pagado' },
  rechazado: { color: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rechazado' },
};

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
      <div className="flex flex-col justify-center items-center py-24 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Cargando detalles de la tesis...</p>
      </div>
    );
  }

  if (!tesis) {
    return (
      <div className="p-8 text-center min-h-[40vh] flex flex-col items-center justify-center bg-card rounded-lg border border-dashed shadow-sm space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="font-semibold text-lg text-foreground">Tesis no encontrada</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          No pudimos localizar la tesis solicitada. Por favor, regrese al listado principal.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/tesis">Volver a mis tesis</Link>
        </Button>
      </div>
    );
  }

  const estadoConfig = estadosTesis[tesis.estado] || {
    color: 'bg-muted text-muted-foreground border-border',
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
      toast.error('No se pudo generar el documento PDF');
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
      toast.error('No se pudo descargar el informe PDF');
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
    if (!selectedAsesorId || !selectedJuradoRole) {
      toast.error('Selecciona un asesor y un rol para el jurado');
      return;
    }
    setIsAssigningJurado(true);
    try {
      await tesisApi.asignarJurados(tesisId, [{ asesor_id: selectedAsesorId, rol: selectedJuradoRole }]);
      toast.success('Jurado asignado exitosamente');
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
      toast.success('Acta de sustentación registrada con éxito');
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
      toast.success('Avance calificado correctamente');
      setReviewingAvance(null);
      setReviewObservaciones('');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al calificar avance');
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
    setIsEditing(true);
    try {
      await tesisApi.updateAvance(editingAvance.id, data);
      toast.success('Avance modificado exitosamente');
      setEditingAvance(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al guardar modificaciones');
      throw error;
    } finally {
      setIsEditing(false);
    }
  };

  const subirDocumento = async () => {
    if (!docUrl.trim()) {
      toast.error('Indique una URL válida para el archivo');
      return;
    }
    try {
      await tesisApi.subirDocumento(tesisId, { tipo: docTipo, archivo_url: docUrl.trim() });
      toast.success('Documento cargado correctamente');
      setDocUrl('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al cargar documento');
    }
  };

  const crearPago = async () => {
    try {
      await tesisApi.crearPago(tesisId, {
        tipo: nuevoPagoTipo,
        monto: Number(nuevoPagoMonto),
        ...(nuevoPagoObs.trim() ? { observaciones: nuevoPagoObs.trim() } : {}),
      });
      toast.success('Obligación de pago registrada');
      setNuevoPagoObs('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al registrar pago');
    }
  };

  const solicitudPagoEstudiante = async () => {
    const monto = Number(nuevoPagoMonto);
    if (!monto || monto <= 0) {
      toast.error('Indique un monto de pago válido');
      return;
    }
    try {
      await tesisApi.solicitudPagoEstudiante(tesisId, {
        tipo: nuevoPagoTipo,
        monto,
        ...(nuevoPagoObs.trim() ? { observaciones: nuevoPagoObs.trim() } : {}),
      });
      toast.success('Solicitud de pago registrada correctamente');
      setNuevoPagoObs('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al registrar solicitud');
    }
  };

  const validarDocumentoTesisStaff = async (documentoId: number, validado: boolean) => {
    try {
      await tesisApi.validarDocumentoTesis(tesisId, documentoId, {
        validado,
        observaciones: docValidacionObs[documentoId]?.trim() || undefined,
      });
      toast.success('Documento evaluado exitosamente');
      setDocValidacionObs((s) => ({ ...s, [documentoId]: '' }));
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al evaluar documento');
    }
  };

  const cargarComprobante = async (pagoId: number) => {
    const url = comprobanteByPago[pagoId]?.trim();
    if (!url) {
      toast.error('Indique la URL del voucher o comprobante de pago');
      return;
    }
    try {
      await tesisApi.cargarComprobantePago(tesisId, pagoId, { comprobante_url: url });
      toast.success('Comprobante de pago enviado correctamente');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al subir comprobante');
    }
  };

  const verificarPago = async (pagoId: number, estado: string) => {
    try {
      await tesisApi.verificarPago(tesisId, pagoId, { estado });
      toast.success('Estado del pago actualizado correctamente');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
      qc.invalidateQueries({ queryKey: ['tesis-secretaria-cola-validacion'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al evaluar pago');
    }
  };

  const enviarObsJurado = async (juradoTesisId: number) => {
    const obs = juradoObsById[juradoTesisId]?.trim();
    if (!obs) {
      toast.error('Por favor, redacte observaciones válidas');
      return;
    }
    try {
      await tesisApi.juradoObservaciones(tesisId, juradoTesisId, { observaciones: obs });
      toast.success('Observaciones enviadas exitosamente al tesista');
      setJuradoObsById((s) => ({ ...s, [juradoTesisId]: '' }));
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al enviar observaciones');
    }
  };

  const marcarConforme = async (juradoTesisId: number) => {
    try {
      await tesisApi.juradoConforme(tesisId, juradoTesisId);
      toast.success('Conformidad registrada exitosamente');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-checklist', tesisId] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al marcar conformidad');
    }
  };

  const validarExpedito = async () => {
    try {
      await tesisApi.validarExpedito(tesisId);
      toast.success('Tesis calificada formalmente como expedito');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-gate', tesisId] });
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      const motivos = e?.response?.data?.motivos;
      toast.error(msg || 'La tesis aún no cumple con todos los requisitos');
      if (motivos?.length) console.warn(motivos);
    }
  };

  const programarSustentacion = async () => {
    if (!fechaSustentacion) {
      toast.error('Debe seleccionar una fecha para la sustentación');
      return;
    }
    try {
      await tesisApi.programarSustentacion(tesisId, new Date(fechaSustentacion).toISOString());
      toast.success('Fecha de sustentación agendada y guardada');
      setFechaSustentacion('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tesis-gate', tesisId] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al programar fecha');
    }
  };

  const puedeGestionarJurado = hasRole('admin') || hasRole('coordinador');
  const puedeGestionAdministrativaPagosDocs =
    hasRole('admin') || hasRole('coordinador') || hasRole('secretaria');
  const puedeProgramar =
    hasRole('admin') || hasRole('coordinador') || hasRole('secretaria');

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          href="/tesis"
          className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Volver a mis tesis
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal Izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ficha General de la Tesis */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">Ficha de Tesis</div>
                  <CardTitle className="text-2xl leading-tight font-extrabold text-foreground">
                    {tesis.titulo}
                  </CardTitle>
                </div>
                <Badge className={`${estadoConfig.color} border px-3 py-1 font-semibold text-xs rounded-full shrink-0 self-start`}>
                  {estadoConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {tesis.resumen && (
                <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/40">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Resumen del proyecto
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed italic">{tesis.resumen}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                  <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estudiante</p>
                    <p className="font-bold text-sm text-foreground">
                      {tesis.estudiante?.usuario?.nombres} {tesis.estudiante?.usuario?.apellidos}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                  <GraduationCap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asesor Principal</p>
                    <p className="font-bold text-sm text-foreground">
                      {tesis.asesor_principal?.usuario?.nombres} {tesis.asesor_principal?.usuario?.apellidos}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                  <School className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Escuela</p>
                    <p className="font-bold text-sm text-foreground">{tesis.estudiante?.escuela?.nombre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de registro</p>
                    <p className="font-bold text-sm text-foreground">
                      {tesis.fecha_inicio ? formatDate(tesis.fecha_inicio) : 'Sin fecha registrada'}
                    </p>
                  </div>
                </div>
              </div>

              {tesis.fecha_recepcion_documentos && (
                <div className="flex items-center gap-2 p-3 bg-blue-50/50 text-blue-800 text-xs rounded-lg border border-blue-100">
                  <CalendarClock className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Recepción de documentos formalizada el:</strong>{' '}
                    {formatDate(tesis.fecha_recepcion_documentos)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentos repositorio de Tesis */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos de la tesis
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Expediente de archivos y borradores correspondientes. La primera subida del archivo en formato "Tesis final" establecerá la fecha de recepción formal de documentos.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {Array.isArray(tesis.documentos) && tesis.documentos.length > 0 ? (
                <div className="space-y-3">
                  {tesis.documentos.map((d: any) => (
                    <div
                      key={d.id}
                      className="border rounded-xl p-4 bg-card shadow-sm space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                        <span className="capitalize font-bold text-sm text-foreground">
                          {d.tipo.replace(/_/g, ' ')} <span className="text-xs text-muted-foreground">(v{d.version})</span>
                        </span>
                        {d.validado ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-medium px-2 py-0.5 rounded-full">
                            Validado Administrativamente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-medium px-2 py-0.5 rounded-full">
                            Pendiente Validación
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 justify-between text-xs text-muted-foreground">
                        <a
                          href={d.archivo_url}
                          className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver archivo adjunto
                        </a>
                        <span>Subido: {formatDate(d.subido_en)}</span>
                      </div>

                      {puedeGestionAdministrativaPagosDocs && !d.validado && (
                        <div className="space-y-2 pt-2 border-t mt-2">
                          <Label className="text-xs font-semibold">Observación de Secretaría</Label>
                          <Textarea
                            placeholder="Describa el motivo de la observación, correcciones necesarias o justificación..."
                            rows={2}
                            value={docValidacionObs[d.id] ?? ''}
                            onChange={(e) =>
                              setDocValidacionObs((s) => ({ ...s, [d.id]: e.target.value }))
                            }
                            className="text-xs"
                          />
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => validarDocumentoTesisStaff(d.id, true)}
                              className="text-xs"
                            >
                              Marcar como válido
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => validarDocumentoTesisStaff(d.id, false)}
                              className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                            >
                              Registrar Observación
                            </Button>
                          </div>
                        </div>
                      )}
                      {d.observaciones && (
                        <div className="text-xs p-2.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                          <span>
                            <strong>Observaciones:</strong> {d.observaciones}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl bg-muted/20 border border-dashed text-sm">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="font-medium text-foreground">Sin documentos registrados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cargue el primer archivo del proyecto en el panel a continuación para iniciar el expediente.
                  </p>
                </div>
              )}

              {/* Formulario condicional para cargar documentos */}
              {tesis.estado === 'culminado' ? (
                esEstudianteTesista ? (
                  // Bloqueado para el estudiante
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-green-200 bg-green-50/50 text-green-800 text-sm">
                    <Lock className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Tesis Culminada e Histórica</p>
                      <p className="text-xs text-green-700/90 mt-0.5">
                        Esta tesis se encuentra en estado **culminado**. El expediente está oficialmente cerrado para la carga de nuevos documentos por parte del estudiante.
                      </p>
                    </div>
                  </div>
                ) : (
                  // Habilitado para el Admin con aviso de Modo Admin
                  (hasRole('admin') || hasRole('coordinador')) && (
                    <div className="space-y-4 p-4 border border-dashed rounded-xl bg-amber-50/50 border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <span>Modo Administrativo: Carga permitida por Rol Administrativo (Tesis Culminada)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 space-y-1 w-full">
                          <Label className="text-xs font-semibold">Tipo de documento</Label>
                          <Select
                            className="w-full"
                            value={docTipo}
                            options={DOC_TIPOS}
                            onChange={(e) => setDocTipo(e.target.value)}
                          />
                        </div>
                        <div className="flex-[2] space-y-1 w-full">
                          <Label className="text-xs font-semibold">URL del archivo (Drive / PDF)</Label>
                          <Input
                            value={docUrl}
                            onChange={(e) => setDocUrl(e.target.value)}
                            placeholder="https://drive.google.com/..."
                            className="text-sm"
                          />
                        </div>
                        <Button type="button" onClick={subirDocumento} className="w-full sm:w-auto shadow-sm">
                          Cargar
                        </Button>
                      </div>
                    </div>
                  )
                )
              ) : (
                // Si la tesis no está culminada, estudiante y admin pueden subir
                (esEstudianteTesista || hasRole('admin') || hasRole('coordinador')) && (
                  <div className="flex flex-col sm:flex-row gap-3 items-end bg-muted/20 p-4 rounded-xl border border-border/40">
                    <div className="flex-1 space-y-1.5 w-full">
                      <Label className="text-xs font-bold text-foreground">Tipo de Documento</Label>
                      <Select
                        className="w-full"
                        value={docTipo}
                        options={DOC_TIPOS}
                        onChange={(e) => setDocTipo(e.target.value)}
                      />
                    </div>
                    <div className="flex-[2] space-y-1.5 w-full">
                      <Label className="text-xs font-bold text-foreground">Enlace o URL del Archivo (Drive/PDF)</Label>
                      <Input
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        placeholder="https://ejemplo.com/archivo.pdf"
                        className="text-sm"
                      />
                    </div>
                    <Button type="button" onClick={subirDocumento} className="w-full sm:w-auto shadow-sm">
                      Subir registro
                    </Button>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Pagos y Comprobantes */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-5">
              <CardTitle className="text-lg flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-primary" />
                Pagos y comprobantes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {puedeGestionAdministrativaPagosDocs && (
                <div className="space-y-4 border-b pb-6">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Registrar Obligación de Pago (Secretaría)
                  </div>
                  <div className="flex flex-wrap gap-3 items-end bg-muted/20 p-4 rounded-xl border border-border/40">
                    <div className="flex-1 min-w-[150px]">
                      <Label className="text-xs font-semibold">Concepto</Label>
                      <Select
                        className="w-full"
                        value={nuevoPagoTipo}
                        options={PAGO_TIPOS}
                        onChange={(e) => setNuevoPagoTipo(e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-xs font-semibold">Monto (S/)</Label>
                      <Input
                        className="text-sm"
                        value={nuevoPagoMonto}
                        onChange={(e) => setNuevoPagoMonto(e.target.value)}
                      />
                    </div>
                    <div className="flex-[2] min-w-[200px]">
                      <Label className="text-xs font-semibold">Nota o referencia</Label>
                      <Input
                        value={nuevoPagoObs}
                        onChange={(e) => setNuevoPagoObs(e.target.value)}
                        placeholder="Ej. Pago Turnitin - 1ra oportunidad..."
                        className="text-sm"
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={crearPago} className="shadow-sm">
                      Registrar obligación
                    </Button>
                  </div>
                </div>
              )}

              {esEstudianteTesista && !puedeGestionAdministrativaPagosDocs && tesis.estado !== 'culminado' && (
                <div className="space-y-4 border-b pb-6">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Registrar Solicitud de Pago
                  </div>
                  <div className="flex flex-wrap gap-3 items-end bg-muted/20 p-4 rounded-xl border border-border/40">
                    <div className="flex-1 min-w-[150px]">
                      <Label className="text-xs font-semibold">Concepto a solicitar</Label>
                      <Select
                        className="w-full"
                        value={nuevoPagoTipo}
                        options={PAGO_TIPOS}
                        onChange={(e) => setNuevoPagoTipo(e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-xs font-semibold">Monto (S/)</Label>
                      <Input
                        className="text-sm"
                        value={nuevoPagoMonto}
                        onChange={(e) => setNuevoPagoMonto(e.target.value)}
                      />
                    </div>
                    <div className="flex-[2] min-w-[200px]">
                      <Label className="text-xs font-semibold">Comentario opcional</Label>
                      <Input
                        value={nuevoPagoObs}
                        onChange={(e) => setNuevoPagoObs(e.target.value)}
                        placeholder="Escriba indicaciones o notas..."
                        className="text-sm"
                      />
                    </div>
                    <Button type="button" onClick={solicitudPagoEstudiante} className="shadow-sm">
                      Solicitar pago
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La secretaría revisará su solicitud para habilitarle formalmente la obligación y permitir la carga de comprobantes.
                  </p>
                </div>
              )}

              {Array.isArray(tesis.pagos) && tesis.pagos.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Historial y Estado de Pagos
                  </div>
                  {tesis.pagos.map((p: any) => {
                    const cfg = PAGO_ESTADO_CONFIG[p.estado] || {
                      color: 'bg-muted text-muted-foreground border-border',
                      label: String(p.estado),
                    };

                    return (
                      <div
                        key={p.id}
                        className="border rounded-xl p-4 bg-card shadow-sm space-y-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-center flex-wrap gap-2 border-b pb-2">
                          <span className="font-bold text-sm text-foreground">
                            {PAGO_LABELS[p.tipo] || String(p.tipo).replace(/_/g, ' ')}
                          </span>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="font-bold text-sm bg-muted/40 border">
                              S/ {Number(p.monto).toFixed(2)}
                            </Badge>
                            <Badge variant="outline" className={`${cfg.color} font-medium px-2 py-0.5 rounded-full border`}>
                              {cfg.label}
                            </Badge>
                          </div>
                        </div>

                        {p.comprobante_url && (
                          <div className="text-xs font-medium text-muted-foreground">
                            <a
                              href={p.comprobante_url}
                              className="text-primary hover:underline inline-flex items-center gap-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver comprobante cargado
                            </a>
                            {p.comprobante_subido_en && (
                              <span className="ml-2">({formatDate(p.comprobante_subido_en)})</span>
                            )}
                          </div>
                        )}

                        {esEstudianteTesista && tesis.estado !== 'culminado' && (p.estado === 'pendiente' || p.estado === 'comprobante_cargado' || p.estado === 'rechazado') && (
                          <div className="pt-2 border-t">
                            <Label className="text-xs font-semibold block mb-1">Cargar comprobante de pago</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="URL del comprobante o captura en Drive"
                                value={comprobanteByPago[p.id] ?? ''}
                                onChange={(e) =>
                                  setComprobanteByPago((s) => ({ ...s, [p.id]: e.target.value }))
                                }
                                className="text-xs flex-1"
                              />
                              <Button size="sm" type="button" onClick={() => cargarComprobante(p.id)} className="text-xs">
                                Enviar comprobante
                              </Button>
                            </div>
                          </div>
                        )}

                        {puedeGestionAdministrativaPagosDocs && (
                          <div className="pt-2 border-t flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              type="button"
                              disabled={(!p.comprobante_url && p.estado === 'pendiente') || p.estado === 'verificado'}
                              onClick={() => verificarPago(p.id, 'verificado')}
                              className="text-xs"
                            >
                              Marcar como verificado
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              disabled={p.estado === 'verificado'}
                              onClick={() => verificarPago(p.id, 'rechazado')}
                              className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                            >
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl bg-muted/20 border border-dashed text-sm">
                  <CircleDollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="font-medium text-foreground">Sin registros de pago vinculados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Una vez registrada una obligación de pago, aparecerán los controles para cargar el voucher.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jurados y Observaciones */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-5">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Miembros del Jurado ({juradoCount}/3)
                </CardTitle>
                {puedeGestionarJurado && (
                  <Button size="sm" variant="secondary" onClick={() => setOpenAssignModal(true)} className="shadow-sm">
                    Asignar jurado
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Con 3 miembros del jurado asignados se habilita la revisión formal de la tesis. Cada jurado emitirá observaciones o registrará su conformidad.
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {Array.isArray(tesis.jurados) && tesis.jurados.length > 0 ? (
                <div className="space-y-4">
                  {tesis.jurados.map((jurado: any) => {
                    const rev = jurado.revisiones?.[0];
                    const esMiJurado = user?.id === jurado.asesor?.usuario?.id && hasRole('asesor');

                    let statusBadge = (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 rounded-full font-medium">
                        Revisión pendiente
                      </Badge>
                    );
                    if (rev) {
                      statusBadge = rev.conforme ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 rounded-full font-medium">
                          Conforme
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 rounded-full font-medium">
                          Con observaciones
                        </Badge>
                      );
                    }

                    return (
                      <div key={jurado.id} className="border rounded-xl p-4 bg-card shadow-sm space-y-3 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start flex-wrap gap-2 border-b pb-2">
                          <div>
                            <p className="font-bold text-sm text-foreground">
                              {jurado.asesor.usuario.nombres} {jurado.asesor.usuario.apellidos}
                            </p>
                            <p className="text-xs text-muted-foreground font-semibold capitalize mt-0.5">
                              Rol: {jurado.rol}
                            </p>
                          </div>
                          {statusBadge}
                        </div>

                        {rev?.observaciones && (
                          <div className="text-xs p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-100/50 italic">
                            <strong>Observaciones del jurado:</strong> {rev.observaciones}
                          </div>
                        )}

                        {esMiJurado && juradoCount >= 3 && (
                          <div className="space-y-3 pt-3 border-t">
                            <Label className="text-xs font-bold block">Registrar Evaluación (Rol: Jurado)</Label>
                            <Textarea
                              placeholder="Redacte observaciones detalladas si decide observar la tesis..."
                              value={juradoObsById[jurado.id] ?? ''}
                              onChange={(e) =>
                                setJuradoObsById((s) => ({ ...s, [jurado.id]: e.target.value }))
                              }
                              rows={3}
                              className="text-xs"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                type="button"
                                onClick={() => enviarObsJurado(jurado.id)}
                                className="text-xs"
                              >
                                Enviar Observaciones
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                type="button"
                                onClick={() => marcarConforme(jurado.id)}
                                className="text-xs"
                              >
                                Otorgar Conformidad
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl bg-muted/20 border border-dashed text-sm">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="font-medium text-foreground">No hay jurados designados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    El coordinador o administrador asignará los tres jurados necesarios para habilitar la etapa de evaluación formal.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validación final (cierre) */}
          {(hasRole('admin') || hasRole('coordinador') || hasRole('secretaria')) && checklist && (
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10 border-b p-5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Validación final (cierre)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
                    {checklist.detalle?.practicas_ok ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <span className="font-medium text-foreground">Prácticas profesionales aprobadas</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
                    {checklist.detalle?.jurado_ok ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <span className="font-medium text-foreground">Conformidad de jurados (3/3)</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
                    {checklist.detalle?.documento_final_ok ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <span className="font-medium text-foreground">Tesis final validada por secretaría</span>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
                    {checklist.detalle?.pagos_ok ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <span className="font-medium text-foreground">Obligaciones de pago canceladas</span>
                  </div>
                </div>

                {!checklist.completo && checklist.motivos?.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs space-y-1.5 text-amber-900">
                    <span className="font-bold block">Requisitos pendientes de subsanación:</span>
                    <ul className="list-disc pl-5 space-y-1">
                      {checklist.motivos.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(hasRole('admin') || hasRole('coordinador')) && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      disabled={tesis.estado === 'expedito'}
                      onClick={validarExpedito}
                      className="w-full sm:w-auto shadow-sm"
                    >
                      Declarar tesis como Expedito
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Avances */}
          {Array.isArray(tesis.avances) && tesis.avances.length > 0 && (
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10 border-b p-5">
                <CardTitle className="text-lg">Avances del proyecto</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {tesis.avances.map((avance: any) => {
                    let badgeClass = 'bg-yellow-100 text-yellow-800';
                    if (avance.estado === 'aprobado') {
                      badgeClass = 'bg-green-100 text-green-800';
                    } else if (avance.estado === 'observado') {
                      badgeClass = 'bg-red-100 text-red-800';
                    }

                    return (
                      <div
                        key={avance.id}
                        className="border rounded-xl p-4 bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4 border-b pb-2 mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-sm text-foreground capitalize">{avance.tipo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Entregado: {formatDate(avance.fecha_entrega)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`${badgeClass} font-semibold rounded-full px-2 py-0.5 text-xs border-0`}>
                              {avance.estado}
                            </Badge>
                            {(hasRole('admin') || hasRole('asesor') || hasRole('coordinador')) && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => openReviewModal(avance)} className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingAvance(avance)} className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 text-xs leading-relaxed">{avance.descripcion}</p>

                        {avance.observaciones && (
                          <div className="text-xs p-2.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-100 mt-2 flex items-start gap-2">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
                            <span>
                              <strong>Observaciones:</strong> {avance.observaciones}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Derecha de Acción (Sidebar) */}
        <div className="space-y-6">
          {/* Acta de Sustentación */}
          {tesis.acta && (
            <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50/20 to-card">
              <CardHeader className="bg-amber-500/10 border-b border-amber-200/50 p-5">
                <CardTitle className="flex items-center text-amber-800 text-lg">
                  <Star className="h-5 w-5 mr-2 text-amber-500 fill-amber-500" />
                  Acta de sustentación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de registro</p>
                  <p className="font-bold text-foreground mt-0.5">{formatDate(tesis.acta.fecha)}</p>
                </div>
                {tesis.acta.lugar && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lugar</p>
                    <p className="font-bold text-foreground mt-0.5">{tesis.acta.lugar}</p>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nota final</p>
                  <p className="text-4xl font-extrabold text-primary mt-1">{tesis.acta.nota_final}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sustentación Habilitación */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-5">
              <CardTitle className="text-sm font-bold">Estado de Sustentación</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {gate && (
                <div
                  className={`text-xs p-3.5 rounded-xl border ${
                    gate.permitido
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {gate.permitido ? (
                    <p className="font-semibold">Apto para programar: Se cumplen todos los requisitos del flujo.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                        Programación bloqueada
                      </p>
                      <span className="text-muted-foreground text-[11px] block leading-tight">
                        Requisitos pendientes de verificación administrativa:
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                        {gate.motivos?.map((m: string, i: number) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {puedeProgramar && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Seleccionar fecha de sustentación</Label>
                    <Input
                      type="date"
                      value={fechaSustentacion}
                      onChange={(e) => setFechaSustentacion(e.target.value)}
                      disabled={!gate?.permitido}
                      className="text-xs"
                    />
                  </div>
                  <Button className="w-full text-xs shadow-sm" disabled={!gate?.permitido} onClick={programarSustentacion}>
                    Programar sustentación
                  </Button>
                </div>
              )}

              {esEstudianteTesista && (
                <p className="text-[11px] text-muted-foreground leading-snug">
                  La programación formal de la fecha del evento queda sujeta a que cuente con sus prácticas aprobadas y la tesis esté validada en estado expedito.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-5">
              <CardTitle className="text-sm font-bold">Acciones disponibles</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {hasRole('estudiante') && tesis.estado !== 'culminado' && (
                  <Link href={`/tesis/${tesisId}/avances`} className="w-full block">
                    <Button className="w-full text-xs" variant="secondary">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Registrar nuevo avance
                    </Button>
                  </Link>
                )}

                <Button
                  className="w-full text-xs"
                  variant="outline"
                  onClick={handleVerDocumento}
                  disabled={isViewingPdf || isDownloadingPdf}
                >
                  {isViewingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Ver documento reporte
                </Button>

                <Button
                  className="w-full text-xs"
                  variant="outline"
                  onClick={handleDescargarInforme}
                  disabled={isViewingPdf || isDownloadingPdf}
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Descargar informe pdf
                </Button>

                {puedeGestionarJurado && (
                  <Button className="w-full text-xs" variant="secondary" onClick={() => setOpenAssignModal(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Asignar nuevo jurado
                  </Button>
                )}

                {puedeGestionarJurado && tesis.estado === 'sustentacion_programada' && !tesis.acta && (
                  <Button className="w-full text-xs" variant="secondary" onClick={() => setOpenActaModal(true)}>
                    <Star className="h-4 w-4 mr-2" />
                    Generar acta de sustentación
                  </Button>
                )}

                {tesis.acta?.archivo_acta_pdf && (
                  <Button className="w-full text-xs" variant="outline" onClick={handleDownloadActaPdf}>
                    Descargar acta PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs / Modals */}
      <Dialog open={!!reviewingAvance} onClose={closeReviewModal} title="Revisar avance">
        {reviewingAvance && (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/40 p-4 rounded-xl border">
              <h4 className="font-bold text-sm text-foreground capitalize">{reviewingAvance.type || reviewingAvance.tipo}</h4>
              <p className="text-xs text-muted-foreground mt-1">{reviewingAvance.descripcion}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observaciones de la evaluación</Label>
              <Textarea
                placeholder="Escriba comentarios, objeciones o detalles sobre la aprobación..."
                value={reviewObservaciones}
                onChange={(e) => setReviewObservaciones(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeReviewModal} disabled={isReviewing} className="text-xs">
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRevisarAvance(reviewingAvance.id, 'observado')}
                disabled={isReviewing}
                className="text-xs bg-rose-600 hover:bg-rose-700"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Registrar Observado
              </Button>
              <Button onClick={() => handleRevisarAvance(reviewingAvance.id, 'aprobado')} disabled={isReviewing} className="text-xs">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Aprobar Avance
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={openAssignModal} onClose={() => setOpenAssignModal(false)} title="Asignar jurado a la tesis">
        <form onSubmit={handleAssignJurado} className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Debe designar tres docentes con roles diferenciados (presidente, secretario, vocal) para componer el jurado.
          </p>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Seleccionar docente</Label>
            <Select
              className="w-full"
              value={selectedAsesorId ? String(selectedAsesorId) : ''}
              options={
                availableAsesores.length > 0
                  ? availableAsesores.map((a: any) => ({
                      value: String(a.id),
                      label: `${a.usuario.nombres} ${a.usuario.apellidos}`,
                    }))
                  : [{ value: '', label: 'Sin asesores disponibles en este momento' }]
              }
              onChange={(e) => setSelectedAsesorId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Rol del jurado</Label>
            <Select
              className="w-full"
              value={selectedJuradoRole}
              options={[
                { value: '', label: 'Seleccionar rol...' },
                { value: 'presidente', label: 'Presidente' },
                { value: 'secretario', label: 'Secretario' },
                { value: 'vocal', label: 'Vocal' },
              ]}
              onChange={(e) => setSelectedJuradoRole(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setOpenAssignModal(false)} disabled={isAssigningJurado} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" disabled={isAssigningJurado} className="text-xs shadow-sm">
              {isAssigningJurado ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Designar miembro
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={openActaModal} onClose={() => setOpenActaModal(false)} title="Acta de sustentación formal">
        <form onSubmit={handleCrearActa} className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Complete los datos finales del evento de sustentación y cargue el documento probatorio en PDF.
          </p>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Fecha del evento</Label>
            <Input type="date" value={actaFecha} onChange={(e) => setActaFecha(e.target.value)} className="text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Lugar de sustentación</Label>
            <Input placeholder="Aula / Auditorio / Google Meet Link..." value={actaLugar} onChange={(e) => setActaLugar(e.target.value)} className="text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Calificación o Nota final obtenida</Label>
            <Input
              type="number"
              placeholder="Nota final (0 - 20)"
              value={actaNota}
              onChange={(e) => setActaNota(e.target.value ? Number(e.target.value) : '')}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Documento digitalizado del Acta (PDF)</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setActaFile(e.target.files?.[0] || null)} className="text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setOpenActaModal(false)} disabled={isCreatingActa} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreatingActa} className="text-xs shadow-sm">
              {isCreatingActa ? 'Guardando...' : 'Guardar y registrar'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!editingAvance} onClose={() => setEditingAvance(null)} title="Modificar registro de avance">
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

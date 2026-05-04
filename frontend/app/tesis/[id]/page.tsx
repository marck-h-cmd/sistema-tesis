'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { reportesApi, tesisApi, asesoresApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDate } from '@/lib/utils/formatDate';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, School, FileText, Star, CheckCircle, XCircle, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { AvanceEditForm } from '@/components/forms/AvanceEditForm';

const estadosTesis: Record<string, { color: string; label: string }> = {
  propuesta: { color: 'bg-blue-100 text-blue-800', label: 'Propuesta' },
  desarrollo: { color: 'bg-yellow-100 text-yellow-800', label: 'En Desarrollo' },
  sustentacion: { color: 'bg-purple-100 text-purple-800', label: 'En Sustentación' },
  culminado: { color: 'bg-green-100 text-green-800', label: 'Culminado' },
};

export default function TesisDetailPage() {
  const { id } = useParams();
  const tesisId = Number(id);
  const { hasRole } = useAuth();
  const [isViewingPdf, setIsViewingPdf] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [reviewingAvance, setReviewingAvance] = useState<any>(null);
  const [reviewObservaciones, setReviewObservaciones] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [editingAvance, setEditingAvance] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: tesis, isLoading, refetch } = useQuery({
    queryKey: ['tesis', id],
    queryFn: () => tesisApi.getOne(tesisId).then(res => res.data.data),
  });

  const { data: asesores, isLoading: isLoadingAsesores } = useQuery({
    queryKey: ['asesores'],
    queryFn: () => asesoresApi.getAll().then(res => res.data.data),
    enabled: hasRole('admin') || hasRole('coordinador'),
  });

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

  const estadoConfig = estadosTesis[tesis.estado] || { color: 'bg-gray-100 text-gray-800', label: tesis.estado };

  const availableAsesores = (asesores || []).filter(
    (asesor) =>
      asesor.id !== tesis.asesor_principal_id &&
      !tesis.jurados?.some((jurado: any) => jurado.asesor_id === asesor.id),
  );

  const handleVerDocumento = async () => {
    if (!tesisId || Number.isNaN(tesisId)) return;

    try {
      setIsViewingPdf(true);
      const response = await reportesApi.verDocumentoTesis(tesisId);
      const url = window.URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
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
        const base64 = result.split(',')[1] || '';
        resolve(base64);
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
      await tesisApi.asignarJurados(tesisId, [
        { asesor_id: selectedAsesorId, rol: selectedJuradoRole },
      ]);
      toast.success('Jurado asignado exitosamente');
      setOpenAssignModal(false);
      setSelectedAsesorId(null);
      setSelectedJuradoRole('');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al asignar jurado');
    } finally {
      setIsAssigningJurado(false);
    }
  };

  const handleCrearActa = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!actaFecha) {
      toast.error('La fecha de sustentación es obligatoria');
      return;
    }

    if (!actaFile) {
      toast.error('Selecciona el archivo PDF del acta');
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
      toast.success('Acta creada exitosamente');
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
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
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
      // Usar la API de revisión de avances
      await tesisApi.revisarAvance(avanceId, estado, reviewObservaciones || undefined);
      toast.success(`Avance ${estado === 'aprobado' ? 'aprobado' : 'rechazado'} exitosamente`);
      setReviewingAvance(null);
      setReviewObservaciones('');
      refetch(); // Recargar los datos de la tesis
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al revisar el avance');
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
      toast.success('Avance actualizado exitosamente');
      setEditingAvance(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al actualizar el avance');
      throw error; // Re-throw para que el formulario maneje el error
    } finally {
      setIsEditing(false);
    }
  };

  const openEditModal = (avance: any) => {
    setEditingAvance(avance);
  };

  const closeEditModal = () => {
    setEditingAvance(null);
  };

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
              <div className="flex items-start justify-between">
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
                    <p className="font-medium">{tesis.estudiante?.usuario?.nombres} {tesis.estudiante?.usuario?.apellidos}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Asesor</p>
                    <p className="font-medium">{tesis.asesor_principal?.usuario?.nombres} {tesis.asesor_principal?.usuario?.apellidos}</p>
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
                    <p className="font-medium">{tesis.fecha_inicio ? formatDate(tesis.fecha_inicio) : 'No definida'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jurados */}
          {Array.isArray(tesis.jurados) && tesis.jurados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Jurados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tesis.jurados.map((jurado: any) => (
                    <div key={jurado.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{jurado.asesor.usuario.nombres} {jurado.asesor.usuario.apellidos}</p>
                        <p className="text-sm text-muted-foreground">{jurado.asesor.especialidad}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{jurado.rol}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avances */}
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
                          <Badge className={
                            avance.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                            avance.estado === 'observado' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {avance.estado}
                          </Badge>
                          {(hasRole('admin') || hasRole('asesor') || hasRole('coordinador')) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewModal(avance)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(avance)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {avance.observaciones && (
                        <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                          {avance.observaciones}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {tesis.acta && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Acta de Sustentación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                    <p className="text-sm text-muted-foreground">Nota Final</p>
                    <p className="text-3xl font-bold text-primary">{tesis.acta.nota_final}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                  Ver documento
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleDescargarInforme}
                  disabled={isViewingPdf || isDownloadingPdf}
                >
                  Descargar informe
                </Button>
                {(hasRole('admin') || hasRole('coordinador')) && (
                  <>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => setOpenAssignModal(true)}
                    >
                      Asignar jurado
                    </Button>
                    {tesis.estado === 'sustentacion' && !tesis.acta && (
                      <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => setOpenActaModal(true)}
                      >
                        Crear acta de sustentación
                      </Button>
                    )}
                    {tesis.acta?.archivo_acta_pdf && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handleDownloadActaPdf}
                      >
                        Descargar acta PDF
                      </Button>
                    )}
                  </>
                )}
              </div>
              {(hasRole('admin') || hasRole('coordinador')) && tesis.estado !== 'sustentacion' && !tesis.acta && (
                <p className="text-sm text-muted-foreground mt-4">
                  El acta se puede crear solo cuando la tesis está en fase de sustentación.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de revisión de avances */}
      <Dialog
        open={!!reviewingAvance}
        onClose={closeReviewModal}
        title="Revisar Avance"
      >
        {reviewingAvance && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium capitalize">{reviewingAvance.tipo}</h4>
              <p className="text-sm text-gray-600 mt-1">{reviewingAvance.descripcion}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Entregado: {formatDate(reviewingAvance.fecha_entrega)}
              </p>
              <Badge className={`mt-2 ${
                reviewingAvance.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                reviewingAvance.estado === 'observado' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                Estado actual: {reviewingAvance.estado}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observaciones (opcional)</label>
              <Textarea
                value={reviewObservaciones}
                onChange={(e) => setReviewObservaciones(e.target.value)}
                placeholder="Agregue observaciones o comentarios sobre el avance..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={closeReviewModal}
                disabled={isReviewing}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRevisarAvance(reviewingAvance.id, 'observado')}
                disabled={isReviewing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isReviewing ? 'Procesando...' : 'Rechazar'}
              </Button>
              <Button
                onClick={() => handleRevisarAvance(reviewingAvance.id, 'aprobado')}
                disabled={isReviewing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isReviewing ? 'Procesando...' : 'Aprobar'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={openAssignModal}
        onClose={() => setOpenAssignModal(false)}
        title="Asignar jurado"
      >
        <form onSubmit={handleAssignJurado} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asesor">Seleccionar asesor</Label>
            <Select
              id="asesor"
              className="w-full"
              value={selectedAsesorId ? String(selectedAsesorId) : ''}
              options={availableAsesores.length > 0 ? availableAsesores.map((asesor: any) => ({
                value: String(asesor.id),
                label: `${asesor.usuario.nombres} ${asesor.usuario.apellidos}`,
              })) : [{ value: '', label: 'No hay asesores disponibles' }]}
              onChange={(e) => setSelectedAsesorId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select
              id="rol"
              className="w-full"
              value={selectedJuradoRole}
              options={[
                { value: '', label: 'Elige un rol' },
                { value: 'presidente', label: 'Presidente' },
                { value: 'secretario', label: 'Secretario' },
                { value: 'vocal', label: 'Vocal' },
              ]}
              onChange={(e) => setSelectedJuradoRole(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpenAssignModal(false)} disabled={isAssigningJurado}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isAssigningJurado}>
              {isAssigningJurado ? 'Guardando...' : 'Asignar jurado'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={openActaModal}
        onClose={() => setOpenActaModal(false)}
        title="Crear acta de sustentación"
      >
        <form onSubmit={handleCrearActa} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actaFecha">Fecha de sustentación</Label>
            <Input
              id="actaFecha"
              type="date"
              value={actaFecha}
              onChange={(e) => setActaFecha(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actaLugar">Lugar</Label>
            <Input
              id="actaLugar"
              type="text"
              value={actaLugar}
              onChange={(e) => setActaLugar(e.target.value)}
              placeholder="Lugar de la sustentación"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actaNota">Nota final</Label>
            <Input
              id="actaNota"
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={actaNota}
              onChange={(e) => setActaNota(e.target.value ? Number(e.target.value) : '')}
              placeholder="Nota final"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actaFile">Archivo PDF del acta</Label>
            <Input
              id="actaFile"
              type="file"
              accept="application/pdf"
              onChange={(e) => setActaFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpenActaModal(false)} disabled={isCreatingActa}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreatingActa}>
              {isCreatingActa ? 'Guardando...' : 'Crear acta'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal de edición de avances */}
      <Dialog
        open={!!editingAvance}
        onClose={closeEditModal}
        title="Editar Avance"
      >
        {editingAvance && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium">{tesis.titulo}</h4>
              <p className="text-sm text-gray-600 mt-1">
                Estudiante: {tesis.estudiante?.usuario?.nombres} {tesis.estudiante?.usuario?.apellidos}
              </p>
            </div>

            <AvanceEditForm
              initialData={{
                tipo: editingAvance.tipo,
                descripcion: editingAvance.descripcion,
                fecha_entrega: editingAvance.fecha_entrega.split('T')[0],
                estado: editingAvance.estado,
                observaciones: editingAvance.observaciones || '',
              }}
              onSubmit={handleEditarAvance}
              isLoading={isEditing}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}

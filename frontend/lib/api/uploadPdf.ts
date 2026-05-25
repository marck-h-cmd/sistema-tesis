import { apiClient } from './client';

export type UploadPdfResult = { url: string; nombre_original: string };

export async function uploadPdf(file: File): Promise<UploadPdfResult> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiClient.post<{ success: boolean; data: UploadPdfResult }>(
    '/uploads/pdf',
    fd,
  );
  return res.data.data;
}

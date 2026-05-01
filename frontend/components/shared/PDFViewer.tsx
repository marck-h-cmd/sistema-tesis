'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Loader2 } from 'lucide-react';

interface PDFViewerProps {
  src?: string;
  file?: File | Blob;
  filename?: string;
  width?: string | number;
  height?: string | number;
}

export function PDFViewer({
  src,
  file,
  filename = 'documento.pdf',
  width = '100%',
  height = 600,
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getUrl = (): string | undefined => {
    if (src) return src;
    if (file) return URL.createObjectURL(file);
    return undefined;
  };

  const pdfUrl = getUrl();

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    link.click();
  };

  const handleOpenNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-gray-50">
        <p className="text-red-600 mb-2">{error}</p>
        <Button variant="outline" onClick={() => setError('')}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Vista previa del PDF</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleOpenNewTab} disabled={!pdfUrl}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={!pdfUrl}>
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>
      </div>
      
      <div className="relative border rounded-lg overflow-hidden" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            width={width}
            height={height}
            className="border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Error al cargar el PDF');
              setIsLoading(false);
            }}
            title="PDF Viewer"
          />
        )}
      </div>
    </div>
  );
}
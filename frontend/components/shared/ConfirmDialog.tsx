import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const variants = {
  danger: {
    icon: 'text-red-600',
    bg: 'bg-red-100',
    button: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: 'text-yellow-600',
    bg: 'bg-yellow-100',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    icon: 'text-blue-600',
    bg: 'bg-blue-100',
    button: 'bg-primary hover:bg-primary/90',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'info',
}: ConfirmDialogProps) {
  const styles = variants[variant];

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-full ${styles.bg}`}>
          <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">{message}</p>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button
              className={styles.button}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
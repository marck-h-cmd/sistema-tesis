import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusConfig {
  [key: string]: {
    color: string;
    label: string;
  };
}

interface StatusBadgeProps {
  status: string;
  config: StatusConfig;
  className?: string;
}

export function StatusBadge({ status, config, className }: StatusBadgeProps) {
  const statusInfo = config[status] || {
    color: 'bg-gray-100 text-gray-800',
    label: status,
  };

  return (
    <Badge className={`${statusInfo.color} ${className}`}>
      {statusInfo.label}
    </Badge>
  );
}
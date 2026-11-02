'use client';

import React from 'react';
import { WorkLogStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/constants';
import { getStatusBadgeStyle } from '@/lib/utils';

interface Props {
  status: WorkLogStatus;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const { badgeClass, dotColor } = getStatusBadgeStyle(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      {STATUS_LABELS[status]}
    </span>
  );
};

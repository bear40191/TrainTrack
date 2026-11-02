import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { WorkLogStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = dateString.includes('T') ? parseISO(dateString) : new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: th });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = dateString.includes('T') ? parseISO(dateString) : new Date(dateString);
    return format(date, 'd MMM yyyy HH:mm น.', { locale: th });
  } catch {
    return dateString;
  }
}

// โทนสีสถานะแบบ Clean Professional (พื้นขาว/เทาอ่อน สบายตา)
export function getStatusBadgeStyle(status: WorkLogStatus): {
  badgeClass: string;
  dotColor: string;
} {
  switch (status) {
    case 'draft':
      return {
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-400',
      };
    case 'pending_mentor':
      return {
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'pending_lead':
      return {
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
      };
    case 'revision_required':
      return {
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
      };
    case 'approved':
      return {
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
  }
}

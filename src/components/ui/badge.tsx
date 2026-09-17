import React from 'react';
import clsx from 'clsx';
import { KamarStatus, FormStatus } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium border rounded-md select-none';

  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    accent: 'bg-slate-900 text-white border-slate-900',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={clsx(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: KamarStatus | FormStatus | string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  let variant: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' = 'neutral';

  switch (status) {
    case 'Terpenuhi':
    case 'OPEN':
    case 'SUCCESS':
    case 'IMPORTED':
      variant = 'success';
      break;
    case 'Sebagian':
    case 'PREVIEW':
      variant = 'warning';
      break;
    case 'Form ditutup':
    case 'CLOSED':
    case 'MAINTENANCE':
    case 'Nonaktif':
    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
      variant = 'danger';
      break;
    case 'Belum ditetapkan':
    default:
      variant = 'neutral';
      break;
  }

  return (
    <Badge variant={variant} size={size}>
      {status}
    </Badge>
  );
};

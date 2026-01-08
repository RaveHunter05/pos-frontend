import type React from 'react';

type ChartAccent = 'indigo' | 'emerald' | 'purple' | 'sky' | 'orange' | 'rose';
type ChartVariant = 'gradient' | 'left-border' | 'top-border' | 'tinted';

const ACCENTS: Record<
  ChartAccent,
  {
    dot: string;
    badge: string;
    gradientFrom: string;
    tintBg: string;
    borderSoft: string;
    borderLeft: string;
    borderTop: string;
  }
> = {
  indigo: {
    dot: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-800',
    gradientFrom: 'from-indigo-50',
    tintBg: 'bg-indigo-50/50',
    borderSoft: 'border-indigo-100',
    borderLeft: 'border-l-indigo-500',
    borderTop: 'border-t-indigo-500'
  },
  emerald: {
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800',
    gradientFrom: 'from-emerald-50',
    tintBg: 'bg-emerald-50/50',
    borderSoft: 'border-emerald-100',
    borderLeft: 'border-l-emerald-500',
    borderTop: 'border-t-emerald-500'
  },
  purple: {
    dot: 'bg-purple-600',
    badge: 'bg-purple-100 text-purple-800',
    gradientFrom: 'from-purple-50',
    tintBg: 'bg-purple-50/50',
    borderSoft: 'border-purple-100',
    borderLeft: 'border-l-purple-500',
    borderTop: 'border-t-purple-500'
  },
  sky: {
    dot: 'bg-sky-600',
    badge: 'bg-sky-100 text-sky-800',
    gradientFrom: 'from-sky-50',
    tintBg: 'bg-sky-50/50',
    borderSoft: 'border-sky-100',
    borderLeft: 'border-l-sky-500',
    borderTop: 'border-t-sky-500'
  },
  orange: {
    dot: 'bg-orange-600',
    badge: 'bg-orange-100 text-orange-800',
    gradientFrom: 'from-orange-50',
    tintBg: 'bg-orange-50/50',
    borderSoft: 'border-orange-100',
    borderLeft: 'border-l-orange-500',
    borderTop: 'border-t-orange-500'
  },
  rose: {
    dot: 'bg-rose-600',
    badge: 'bg-rose-100 text-rose-800',
    gradientFrom: 'from-rose-50',
    tintBg: 'bg-rose-50/50',
    borderSoft: 'border-rose-100',
    borderLeft: 'border-l-rose-500',
    borderTop: 'border-t-rose-500'
  }
};

const baseCard = 'rounded-xl shadow-sm p-6 ring-1 ring-black/5';

const variantClass = (variant: ChartVariant, accent: (typeof ACCENTS)[ChartAccent]) => {
  switch (variant) {
    case 'left-border':
      return `bg-white border border-gray-200 border-l-4 ${accent.borderLeft}`;
    case 'top-border':
      return `bg-white border border-gray-200 border-t-4 ${accent.borderTop}`;
    case 'tinted':
      return `${accent.tintBg} border ${accent.borderSoft}`;
    case 'gradient':
    default:
      return `bg-gradient-to-br ${accent.gradientFrom} to-white border ${accent.borderSoft}`;
  }
};

export type ChartCardProps = {
  title: string;
  subtitle?: string;
  badgeText?: string;
  accent?: ChartAccent;
  variant?: ChartVariant;
  contentHeight?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyText?: string;
  children?: React.ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  badgeText,
  accent = 'indigo',
  variant = 'gradient',
  contentHeight = 260,
  isLoading,
  isEmpty,
  emptyText = 'Sin datos para mostrar',
  children
}: ChartCardProps) {
  const styles = ACCENTS[accent];

  return (
    <div className={`${baseCard} ${variantClass(variant, styles)}`}>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {badgeText && (
          <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles.badge}`}>
            {badgeText}
          </span>
        )}
      </header>

      <div style={{ height: contentHeight }}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-gray-500">Cargando...</div>
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center text-gray-500">{emptyText}</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}


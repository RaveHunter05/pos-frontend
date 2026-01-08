import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { Invoice } from '@/types/domain';
import { unwrapApiList } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../../hooks/useApi';
import { ChartCard } from './ChartCard';

type SalesByDayPoint = {
  date: string;
  total: number;
};

type SalesByWeekdayChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

const WEEKDAYS: Array<{ day: number; label: string }> = [
  { day: 1, label: 'Lun' },
  { day: 2, label: 'Mar' },
  { day: 3, label: 'Mié' },
  { day: 4, label: 'Jue' },
  { day: 5, label: 'Vie' },
  { day: 6, label: 'Sáb' },
  { day: 0, label: 'Dom' }
];

export function SalesByWeekdayChart({ from, to, title = 'Ventas por día de la semana' }: SalesByWeekdayChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const rangeFromKey = rangeFrom.format('YYYY-MM-DD');
  const rangeToKey = rangeTo.format('YYYY-MM-DD');
  const { get } = useApi();

  const salesByDayQuery = useQuery({
    queryKey: ['reports', 'sales-by-weekday', rangeFromKey, rangeToKey],
    queryFn: async (): Promise<SalesByDayPoint[]> => {
      try {
        const response = await get<SalesByDayPoint[]>(
          `/api/reports/sales-by-day?from=${encodeURIComponent(rangeFromKey)}&to=${encodeURIComponent(rangeToKey)}`
        );
        if (Array.isArray(response)) return response;
      } catch {
        // Fallback below
      }

      const invoicesResponse = await get('/api/invoices');
      const invoices = unwrapApiList<Invoice>(invoicesResponse);
      const totals = new Map<string, number>();

      invoices.forEach((invoice) => {
        if (invoice.status === 'CANCELLED') return;
        const date = dayjs((invoice.createdAt ?? invoice.issueDate) as string | undefined);
        if (!date.isValid()) return;
        if (date.isBefore(rangeFrom, 'day') || date.isAfter(rangeTo, 'day')) return;
        const key = date.format('YYYY-MM-DD');
        totals.set(key, (totals.get(key) ?? 0) + (invoice.totalAmount ?? (invoice as any).total ?? 0));
      });

      return Array.from(totals.entries()).map(([date, total]) => ({ date, total }));
    }
  });

  const chartData = useMemo(() => {
    const totals = new Map<number, number>(WEEKDAYS.map((d) => [d.day, 0]));
    (salesByDayQuery.data ?? []).forEach((point) => {
      const date = dayjs(point.date);
      if (!date.isValid()) return;
      const day = date.day();
      totals.set(day, (totals.get(day) ?? 0) + (point.total ?? 0));
    });

    return WEEKDAYS.map((weekday) => ({
      day: weekday.label,
      total: totals.get(weekday.day) ?? 0
    }));
  }, [salesByDayQuery.data]);

  const sum = useMemo(() => chartData.reduce((acc, item) => acc + (item.total ?? 0), 0), [chartData]);
  const isEmpty = !salesByDayQuery.isLoading && (!chartData.length || sum <= 0);

  const bestDay = useMemo(() => {
    return chartData.reduce<{ day: string; total: number }>(
      (best, current) => (current.total > best.total ? current : best),
      { day: '—', total: 0 }
    );
  }, [chartData]);

  const badgeText = bestDay.total > 0 ? `Mejor: ${bestDay.day}` : undefined;

  return (
    <ChartCard
      title={title}
      subtitle="Patrón semanal"
      badgeText={badgeText}
      accent="sky"
      variant="tinted"
      isLoading={salesByDayQuery.isLoading}
      isEmpty={isEmpty}
      emptyText="No hay ventas para analizar"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius={90}>
          <PolarGrid />
          <PolarAngleAxis dataKey="day" stroke="#94a3b8" />
          <PolarRadiusAxis stroke="#94a3b8" tickFormatter={(value) => formatCurrency(Number(value))} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Total']}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Radar dataKey="total" stroke="#0284c7" fill="#0284c7" fillOpacity={0.25} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


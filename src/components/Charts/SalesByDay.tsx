import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
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

type SalesByDayChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

export function SalesByDayChart({ from, to, title = 'Ventas por día' }: SalesByDayChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const rangeFromKey = rangeFrom.format('YYYY-MM-DD');
  const rangeToKey = rangeTo.format('YYYY-MM-DD');
  const { get } = useApi();

  const salesByDayQuery = useQuery({
    queryKey: ['reports', 'sales-by-day', rangeFromKey, rangeToKey],
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
        const invoiceDate = dayjs((invoice.createdAt ?? invoice.issueDate) as string | undefined);
        if (!invoiceDate.isValid()) return;
        if (invoiceDate.isBefore(rangeFrom, 'day') || invoiceDate.isAfter(rangeTo, 'day')) return;
        const key = invoiceDate.format('YYYY-MM-DD');
        totals.set(key, (totals.get(key) ?? 0) + (invoice.totalAmount ?? (invoice as any).total ?? 0));
      });

      return Array.from(totals.entries()).map(([date, total]) => ({ date, total }));
    }
  });

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();
    (salesByDayQuery.data ?? []).forEach((point) => {
      const key = dayjs(point.date).format('YYYY-MM-DD');
      totals.set(key, (totals.get(key) ?? 0) + (point.total ?? 0));
    });

    const start = dayjs(rangeFromKey).startOf('day');
    const end = dayjs(rangeToKey).startOf('day');
    if (end.isBefore(start)) return [];

    const data: Array<{ date: string; total: number }> = [];
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end)) {
      const key = cursor.format('YYYY-MM-DD');
      data.push({
        date: cursor.format('DD/MM'),
        total: totals.get(key) ?? 0
      });
      cursor = cursor.add(1, 'day');
    }
    return data;
  }, [salesByDayQuery.data, rangeFromKey, rangeToKey]);

  const total = useMemo(() => chartData.reduce((acc, point) => acc + (point.total ?? 0), 0), [chartData]);
  const isEmpty = !salesByDayQuery.isLoading && (!chartData.length || total <= 0);

  const subtitle = useMemo(() => {
    const fromLabel = dayjs(rangeFromKey).format('DD/MM');
    const toLabel = dayjs(rangeToKey).format('DD/MM');
    return `${fromLabel} - ${toLabel}`;
  }, [rangeFromKey, rangeToKey]);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      badgeText={total > 0 ? `Total ${formatCurrency(total)}` : undefined}
      accent="indigo"
      variant="gradient"
      isLoading={salesByDayQuery.isLoading}
      isEmpty={isEmpty}
      emptyText="No hay ventas en el período"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(Number(value))}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Total']}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#2563eb"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#salesGradient)"
            dot={{ r: 2, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
          <Line type="monotone" dataKey="total" stroke="#1d4ed8" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


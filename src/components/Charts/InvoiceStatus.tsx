import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { Invoice } from '@/types/domain';
import { unwrapApiList } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../../hooks/useApi';
import { ChartCard } from './ChartCard';

type InvoiceStatusChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

type StatusPoint = {
  status: string;
  name: string;
  count: number;
  total: number;
};

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagadas',
  ISSUED: 'Emitidas',
  DRAFT: 'Borrador',
  PENDING: 'Pendientes',
  CANCELLED: 'Canceladas'
};

const STATUS_COLORS: Record<string, string> = {
  PAID: '#16a34a',
  ISSUED: '#2563eb',
  DRAFT: '#f97316',
  PENDING: '#94a3b8',
  CANCELLED: '#ef4444'
};

export function InvoiceStatusChart({ from, to, title = 'Estado de facturas' }: InvoiceStatusChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const rangeFromKey = rangeFrom.format('YYYY-MM-DD');
  const rangeToKey = rangeTo.format('YYYY-MM-DD');
  const { get } = useApi();

  const query = useQuery({
    queryKey: ['reports', 'invoice-status', rangeFromKey, rangeToKey],
    queryFn: async (): Promise<StatusPoint[]> => {
      const invoicesResponse = await get('/api/invoices');
      const invoices = unwrapApiList<Invoice>(invoicesResponse);

      const totals = new Map<string, StatusPoint>();
      invoices.forEach((invoice) => {
        const anyInvoice = invoice as any;
        const rawDate = (invoice.createdAt ?? invoice.issueDate) as string | undefined;
        const date = rawDate ? dayjs(rawDate) : null;
        if (!date || !date.isValid()) return;
        if (date.isBefore(rangeFrom, 'day') || date.isAfter(rangeTo, 'day')) return;

        const status = (invoice.status ?? anyInvoice.status ?? 'N/D') as string;
        const name = STATUS_LABELS[status] ?? status;
        const amount = invoice.totalAmount ?? anyInvoice.total ?? 0;

        const existing = totals.get(status) ?? { status, name, count: 0, total: 0 };
        existing.count += 1;
        existing.total += amount;
        totals.set(status, existing);
      });

      return Array.from(totals.values()).sort((a, b) => b.count - a.count);
    }
  });

  const chartData = useMemo(() => query.data ?? [], [query.data]);
  const totalCount = useMemo(() => chartData.reduce((acc, item) => acc + (item.count ?? 0), 0), [chartData]);
  const isEmpty = !query.isLoading && (!chartData.length || totalCount <= 0);

  const badgeText = totalCount > 0 ? `${totalCount} facturas` : undefined;

  return (
    <ChartCard
      title={title}
      subtitle="Cantidad por estado"
      badgeText={badgeText}
      accent="rose"
      variant="top-border"
      isLoading={query.isLoading}
      isEmpty={isEmpty}
      emptyText="No hay facturas en el período"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            formatter={(value: number, _name, props: any) => {
              const total = props?.payload?.total as number | undefined;
              const totalLabel = typeof total === 'number' ? ` • ${formatCurrency(total)}` : '';
              return [`${value}${totalLabel}`, 'Facturas'];
            }}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={28}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import type { Invoice } from '@/types/domain';
import { unwrapApiList } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../../hooks/useApi';
import { ChartCard } from './ChartCard';

const COLORS = ['#fb923c', '#f97316', '#ea580c', '#fdba74', '#f59e0b', '#0ea5e9'];

type SalesByPaymentMethodChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

type PaymentMethodPoint = {
  name: string;
  total: number;
  count: number;
};

type PaymentMethodApiResponse = Array<{
  id: number;
  name: string;
  type: string;
}>;

const renderPercentLabel = ({ percent }: { percent?: number }) => {
  if (!percent) return '';
  const value = Math.round(percent * 100);
  return value < 10 ? '' : `${value}%`;
};

const renderCenterLabel =
  (total: number) =>
  ({ viewBox }: any) => {
    if (!viewBox) return null;
    const cx = viewBox.cx ?? viewBox.x + viewBox.width / 2;
    const cy = viewBox.cy ?? viewBox.y + viewBox.height / 2;

    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} dy="-0.6em" fill="#64748b" fontSize="11">
          Total
        </tspan>
        <tspan x={cx} dy="1.4em" fill="#0f172a" fontSize="14" fontWeight={700}>
          {formatCurrency(total)}
        </tspan>
      </text>
    );
  };

export function SalesByPaymentMethodChart({ from, to, title = 'Ventas por método de pago' }: SalesByPaymentMethodChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const rangeFromKey = rangeFrom.format('YYYY-MM-DD');
  const rangeToKey = rangeTo.format('YYYY-MM-DD');
  const { get } = useApi();

  const query = useQuery({
    queryKey: ['reports', 'sales-by-payment-method', rangeFromKey, rangeToKey],
    queryFn: async (): Promise<PaymentMethodPoint[]> => {
      const [invoicesResponse, paymentMethodsResponse] = await Promise.all([
        get('/api/invoices'),
        (async () => {
          try {
            return await get<PaymentMethodApiResponse>('/api/payment-methods');
          } catch {
            return [];
          }
        })()
      ]);

      const invoices = unwrapApiList<Invoice>(invoicesResponse);
      const paymentMethods = Array.isArray(paymentMethodsResponse) ? paymentMethodsResponse : [];
      const paymentMethodById = new Map<number, string>(paymentMethods.map((method) => [method.id, method.name]));

      const totals = new Map<string, PaymentMethodPoint>();

      invoices.forEach((invoice) => {
        if (invoice.status === 'CANCELLED') return;

        const anyInvoice = invoice as any;
        const rawDate = (invoice.createdAt ?? invoice.issueDate) as string | undefined;
        const date = rawDate ? dayjs(rawDate) : null;
        if (!date || !date.isValid()) return;
        if (date.isBefore(rangeFrom, 'day') || date.isAfter(rangeTo, 'day')) return;

        const rawPayment: unknown =
          anyInvoice.paymentMethod ?? anyInvoice.paymentMethodName ?? anyInvoice.paymentMethodType ?? invoice.paymentMethod;

        const paymentMethodId = typeof anyInvoice.paymentMethodId === 'number' ? anyInvoice.paymentMethodId : undefined;

        let paymentName: string | undefined;
        if (typeof rawPayment === 'string' && rawPayment.trim()) {
          paymentName = rawPayment.trim();
        } else if (rawPayment && typeof rawPayment === 'object') {
          const maybe = rawPayment as any;
          const maybeName = typeof maybe.name === 'string' ? maybe.name : undefined;
          const maybeType = typeof maybe.type === 'string' ? maybe.type : undefined;
          paymentName = maybeName || maybeType;
        }

        if (!paymentName && paymentMethodId != null) {
          paymentName = paymentMethodById.get(paymentMethodId) ?? `Método #${paymentMethodId}`;
        }

        const name = paymentName || 'N/D';

        const amount = invoice.totalAmount ?? anyInvoice.total ?? 0;
        const existing = totals.get(name) ?? { name, total: 0, count: 0 };
        existing.total += amount;
        existing.count += 1;
        totals.set(name, existing);
      });

      return Array.from(totals.values()).sort((a, b) => b.total - a.total);
    }
  });

  const chartData = useMemo(() => query.data ?? [], [query.data]);
  const total = useMemo(() => chartData.reduce((acc, item) => acc + (item.total ?? 0), 0), [chartData]);
  const isEmpty = !query.isLoading && (!chartData.length || total <= 0);

  const topMethod = chartData[0]?.name;
  const badgeText = topMethod ? `Top: ${topMethod}` : undefined;

  return (
    <ChartCard
      title={title}
      subtitle="Distribución"
      badgeText={badgeText}
      accent="orange"
      variant="gradient"
      isLoading={query.isLoading}
      isEmpty={isEmpty}
      emptyText="No hay ventas para agrupar"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="name"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={2}
            labelLine={false}
            label={renderPercentLabel}
            cornerRadius={8}
          >
            <Label content={renderCenterLabel(total)} position="center" />
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name, props: any) => {
              const count = props?.payload?.count as number | undefined;
              const label = count != null ? `${name} (${count})` : name;
              return [formatCurrency(value), label];
            }}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { Order } from '@/types/domain';
import { unwrapApiList } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../../hooks/useApi';
import { ChartCard } from './ChartCard';

type TopProductsMetric = 'total' | 'quantity';

type TopProductsChartProps = {
  from?: string;
  to?: string;
  title?: string;
  limit?: number;
  metric?: TopProductsMetric;
};

type TopProductPoint = {
  name: string;
  quantity: number;
  total: number;
};

type TopProductApiResponse = Array<{
  productId: number;
  name: string;
  total: number;
  quantity: number;
}>;

const truncateLabel = (value: unknown, max = 18) => {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
};

export function TopProductsChart({
  from,
  to,
  title = 'Top productos',
  limit = 5,
  metric = 'total'
}: TopProductsChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const rangeFromKey = rangeFrom.format('YYYY-MM-DD');
  const rangeToKey = rangeTo.format('YYYY-MM-DD');
  const { get } = useApi();

  const topProductsQuery = useQuery({
    queryKey: ['reports', 'top-products', rangeFromKey, rangeToKey, limit],
    queryFn: async (): Promise<TopProductPoint[]> => {
      try {
        const response = await get<TopProductApiResponse>(
          `/api/reports/top-products?from=${encodeURIComponent(rangeFromKey)}&to=${encodeURIComponent(
            rangeToKey
          )}&limit=${encodeURIComponent(String(limit))}`
        );
        if (Array.isArray(response)) {
          return response.map((item) => ({
            name: item.name,
            quantity: item.quantity ?? 0,
            total: item.total ?? 0
          }));
        }
      } catch {
        // Fallback below
      }

      const ordersResponse = await get('/api/orders');
      const orders = unwrapApiList<Order>(ordersResponse);
      const totals = new Map<string, TopProductPoint>();

      orders.forEach((order) => {
        const orderDate = order.createdAt ? dayjs(order.createdAt) : null;
        if (orderDate && (orderDate.isBefore(rangeFrom, 'day') || orderDate.isAfter(rangeTo, 'day'))) {
          return;
        }

        order.orderItems?.forEach((item) => {
          const key = item.product.id.toString();
          const existing = totals.get(key) ?? { name: item.product.name, quantity: 0, total: 0 };
          existing.quantity += item.quantity;
          existing.total += item.totalPrice;
          totals.set(key, existing);
        });
      });

      return Array.from(totals.values());
    }
  });

  const chartData = useMemo(() => {
    const items = topProductsQuery.data ?? [];
    const valueFor = (item: TopProductPoint) => (metric === 'quantity' ? item.quantity : item.total);
    return items
      .slice()
      .sort((a, b) => valueFor(b) - valueFor(a))
      .slice(0, limit);
  }, [topProductsQuery.data, limit, metric]);

  const totalMetric = useMemo(
    () => chartData.reduce((acc, item) => acc + (metric === 'quantity' ? item.quantity : item.total), 0),
    [chartData, metric]
  );

  const isEmpty = !topProductsQuery.isLoading && (!chartData.length || totalMetric <= 0);

  const subtitle = useMemo(() => {
    const metricLabel = metric === 'quantity' ? 'por unidades' : 'por monto';
    return `Top ${limit} • ${metricLabel}`;
  }, [limit, metric]);

  const badgeText = useMemo(() => {
    if (!chartData.length) return undefined;
    const top = chartData[0];
    if (metric === 'quantity') return `#1 ${top.quantity} u`;
    return `#1 ${formatCurrency(top.total)}`;
  }, [chartData, metric]);

  const xAxisTickFormatter = useMemo(() => {
    if (metric === 'quantity') return (value: number) => String(value);
    return (value: number) => formatCurrency(value);
  }, [metric]);

  const barFill = metric === 'quantity' ? '#f97316' : '#16a34a';
  const barFills = useMemo(
    () => [barFill, '#22c55e', '#86efac', '#34d399', '#059669'],
    [barFill]
  );

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      badgeText={badgeText}
      accent="emerald"
      variant="left-border"
      isLoading={topProductsQuery.isLoading}
      isEmpty={isEmpty}
      emptyText="No hay datos de productos vendidos"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={xAxisTickFormatter} />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            stroke="#94a3b8"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => truncateLabel(value, 16)}
          />
          <Tooltip
            formatter={(value: number) => {
              if (metric === 'quantity') return [value, 'Unidades'];
              return [formatCurrency(value), 'Monto'];
            }}
            labelFormatter={(label) => String(label)}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Bar dataKey={metric} radius={[0, 8, 8, 0]} barSize={16}>
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={barFills[index % barFills.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Order } from '@/types/domain';
import { unwrapApiList } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../../hooks/useApi';
import { ChartCard } from './ChartCard';

const COLORS = ['#6366f1', '#f97316', '#22d3ee', '#22c55e', '#facc15', '#ec4899'];

type RevenueByCategoryChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

type RevenueByCategoryPoint = {
  category: string;
  total: number;
};

type RevenueByCategoryApiResponse = Array<{
  category: string;
  total: number;
}>;

const renderPercentLabel = ({ percent }: { percent?: number }) => {
  if (!percent) return '';
  const value = Math.round(percent * 100);
  return value < 8 ? '' : `${value}%`;
};

export function RevenueByCategoryChart({ from, to, title = 'Ingresos por categoría' }: RevenueByCategoryChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const rangeFromKey = rangeFrom.format('YYYY-MM-DD');
  const rangeToKey = rangeTo.format('YYYY-MM-DD');
  const { get } = useApi();

  const revenueQuery = useQuery({
    queryKey: ['reports', 'revenue-by-category', rangeFromKey, rangeToKey],
    queryFn: async (): Promise<RevenueByCategoryPoint[]> => {
      try {
        const response = await get<RevenueByCategoryApiResponse>(
          `/api/reports/revenue-by-category?from=${encodeURIComponent(rangeFromKey)}&to=${encodeURIComponent(rangeToKey)}`
        );
        if (Array.isArray(response)) return response;
      } catch {
        // Fallback below
      }

      const ordersResponse = await get('/api/orders');
      const orders = unwrapApiList<Order>(ordersResponse);
      const totals = new Map<string, number>();

      orders.forEach((order) => {
        const orderDate = order.createdAt ? dayjs(order.createdAt) : null;
        if (orderDate && (orderDate.isBefore(rangeFrom, 'day') || orderDate.isAfter(rangeTo, 'day'))) {
          return;
        }

        order.orderItems?.forEach((item) => {
          const categories = item.product.productCategories?.length
            ? item.product.productCategories.map((category) => category.name ?? 'Sin categoría')
            : ['Sin categoría'];

          categories.forEach((categoryName) => {
            totals.set(categoryName, (totals.get(categoryName) ?? 0) + item.totalPrice);
          });
        });
      });

      return Array.from(totals.entries()).map(([category, total]) => ({ category, total }));
    }
  });

  const chartData = useMemo(() => {
    return (revenueQuery.data ?? []).slice().sort((a, b) => b.total - a.total);
  }, [revenueQuery.data]);

  const total = useMemo(() => chartData.reduce((acc, item) => acc + (item.total ?? 0), 0), [chartData]);
  const isEmpty = !revenueQuery.isLoading && (!chartData.length || total <= 0);

  const badgeText = total > 0 ? formatCurrency(total) : undefined;

  return (
    <ChartCard
      title={title}
      subtitle="Distribución"
      badgeText={badgeText}
      accent="purple"
      variant="top-border"
      isLoading={revenueQuery.isLoading}
      isEmpty={isEmpty}
      emptyText="No hay ingresos en el período"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="category"
            outerRadius={90}
            labelLine={false}
            label={renderPercentLabel}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.category} fill={COLORS[index % COLORS.length]} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}


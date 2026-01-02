import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Order } from '@/types/domain';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../../hooks/useApi';

const COLORS = ['#6366f1', '#f97316', '#22d3ee', '#22c55e', '#facc15', '#ec4899'];

type RevenueByCategoryChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

export function RevenueByCategoryChart({ from, to, title = 'Ingresos por categoría' }: RevenueByCategoryChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const { get } = useApi();
  
  const ordersQuery = useQuery({
    queryKey: ['orders', 'revenue-by-category'],
    queryFn: async () => {
      const response = await get<Order[]>('/api/orders');
      return response;
    }
  });

  const chartData = useMemo(() => {
    if (!ordersQuery.data) return [];
    const totals = new Map<string, number>();
    ordersQuery.data.forEach((order) => {
      const orderDate = order.createdAt ? dayjs(order.createdAt) : null;
      if (orderDate && (orderDate.isBefore(rangeFrom) || orderDate.isAfter(rangeTo))) {
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
  }, [ordersQuery.data, rangeFrom, rangeTo]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </header>
      {ordersQuery.isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={chartData} dataKey="total" nameKey="category" outerRadius={90} label>
              {chartData.map((entry, index) => (
                <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

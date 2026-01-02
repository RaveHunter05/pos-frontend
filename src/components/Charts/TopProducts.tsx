import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Order } from '@/types/domain';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../../hooks/useApi';

type TopProductsChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

export function TopProductsChart({ from, to, title = 'Top productos' }: TopProductsChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const { get } = useApi();
  
  const ordersQuery = useQuery({
    queryKey: ['orders', 'top-products'],
    queryFn: async () => {
      const response = await get<Order[]>('/api/orders');
      return response;
    }
  });

  const chartData = useMemo(() => {
    if (!ordersQuery.data) return [];
    const totals = new Map<string, { name: string; quantity: number; total: number }>();
    ordersQuery.data.forEach((order) => {
      const orderDate = order.createdAt ? dayjs(order.createdAt) : null;
      if (orderDate && (orderDate.isBefore(rangeFrom) || orderDate.isAfter(rangeTo))) {
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
    return Array.from(totals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
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
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip formatter={(value: number, name) => (name === 'quantity' ? value : formatCurrency(value))} />
            <Bar dataKey="total" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

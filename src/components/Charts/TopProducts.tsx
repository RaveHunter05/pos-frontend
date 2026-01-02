import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { http } from '@/lib/http';
import styles from './ChartCard.module.css';
import type { Order } from '@/types/domain';
import { formatCurrency } from '@/lib/format';

type TopProductsChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

export function TopProductsChart({ from, to, title = 'Top productos' }: TopProductsChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const ordersQuery = useQuery({
    queryKey: ['orders', 'top-products'],
    queryFn: async () => {
      const response = await http.get<Order[]>('/api/orders');
      return response.data;
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
    <div className={styles.card}>
      <header>
        <h3>{title}</h3>
      </header>
      {ordersQuery.isLoading ? (
        <div className={styles.skeleton}>Cargando...</div>
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

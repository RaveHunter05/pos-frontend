import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { http } from '@/lib/http';
import styles from './ChartCard.module.css';
import type { Invoice } from '@/types/domain';

type SalesByDayChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

export function SalesByDayChart({ from, to, title = 'Ventas por día' }: SalesByDayChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const invoicesQuery = useQuery({
    queryKey: ['invoices', 'sales-by-day'],
    queryFn: async () => {
      const response = await http.get<Invoice[]>('/api/invoices');
      return response.data;
    }
  });

  const chartData = useMemo(() => {
    if (!invoicesQuery.data) return [];
    const totals = new Map<string, number>();
    invoicesQuery.data.forEach((invoice) => {
      const invoiceDate = dayjs(invoice.issueDate);
      if (invoiceDate.isBefore(rangeFrom) || invoiceDate.isAfter(rangeTo)) {
        return;
      }
      const key = invoiceDate.format('YYYY-MM-DD');
      totals.set(key, (totals.get(key) ?? 0) + (invoice.totalAmount ?? 0));
    });
    return Array.from(totals.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([date, total]) => ({
        date: dayjs(date).format('DD/MM'),
        total
      }));
  }, [invoicesQuery.data, rangeFrom, rangeTo]);

  return (
    <div className={styles.card}>
      <header>
        <h3>{title}</h3>
      </header>
      {invoicesQuery.isLoading ? (
        <div className={styles.skeleton}>Cargando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" tickFormatter={(value) => `C$${value}`} />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(value: number) => [`C$${value.toFixed(2)}`, 'Total']} />
            <Area type="monotone" dataKey="total" stroke="#2563eb" fillOpacity={1} fill="url(#salesGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

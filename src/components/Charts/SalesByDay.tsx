import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Invoice } from '@/types/domain';
import { useApi } from '../../hooks/useApi';

type SalesByDayChartProps = {
  from?: string;
  to?: string;
  title?: string;
};

export function SalesByDayChart({ from, to, title = 'Ventas por día' }: SalesByDayChartProps = {}) {
  const rangeTo = to ? dayjs(to) : dayjs();
  const rangeFrom = from ? dayjs(from) : rangeTo.subtract(30, 'day');
  const { get } = useApi();
  
  const invoicesQuery = useQuery({
    queryKey: ['invoices', 'sales-by-day'],
    queryFn: async () => {
      const response = await get<Invoice[]>('/api/invoices');
      return response;
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </header>
      {invoicesQuery.isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>
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

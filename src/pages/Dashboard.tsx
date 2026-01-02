import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SalesByDayChart } from '@/components/Charts/SalesByDay';
import { TopProductsChart } from '@/components/Charts/TopProducts';
import { RevenueByCategoryChart } from '@/components/Charts/RevenueByCategory';
import type { Inventory, Invoice, Order } from '@/types/domain';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../hooks/useApi';

export default function Dashboard() {
  const { get } = useApi();
  
  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const [ordersResponse, invoicesResponse, inventoryResponse] = await Promise.all([
        get<Order[]>('/api/orders'),
        get<Invoice[]>('/api/invoices'),
        get<Inventory[]>('/api/inventories')
      ]);
      return {
        orders: ordersResponse,
        invoices: invoicesResponse,
        inventory: inventoryResponse
      };
    }
  });

  const metrics = useMemo(() => {
    if (!metricsQuery.data) {
      return {
        totalSales: 0,
        activeOrders: 0,
        totalInvoices: 0,
        lowStock: 0
      };
    }
    const totalSales = metricsQuery.data.invoices.reduce((acc, invoice) => acc + (invoice.totalAmount ?? 0), 0);
    const activeOrders = metricsQuery.data.orders.filter(
      (order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
    ).length;
    const totalInvoices = metricsQuery.data.invoices.length;
    const lowStock = metricsQuery.data.inventory.filter((item) => item.quantity <= item.minStock).length;
    return { totalSales, activeOrders, totalInvoices, lowStock };
  }, [metricsQuery.data]);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Ventas totales</span>
          <strong className="text-2xl font-bold text-gray-900">
            {metricsQuery.isLoading ? '...' : formatCurrency(metrics.totalSales)}
          </strong>
        </article>
        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Órdenes activas</span>
          <strong className="text-2xl font-bold text-gray-900">
            {metricsQuery.isLoading ? '...' : metrics.activeOrders}
          </strong>
        </article>
        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Facturas emitidas</span>
          <strong className="text-2xl font-bold text-gray-900">
            {metricsQuery.isLoading ? '...' : metrics.totalInvoices}
          </strong>
        </article>
        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Productos con bajo stock</span>
          <strong className="text-2xl font-bold text-gray-900">
            {metricsQuery.isLoading ? '...' : metrics.lowStock}
          </strong>
        </article>
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <SalesByDayChart />
        <TopProductsChart />
        <RevenueByCategoryChart />
      </section>
    </div>
  );
}

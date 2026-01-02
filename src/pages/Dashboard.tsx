import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http';
import styles from './Dashboard.module.css';
import { SalesByDayChart } from '@/components/Charts/SalesByDay';
import { TopProductsChart } from '@/components/Charts/TopProducts';
import { RevenueByCategoryChart } from '@/components/Charts/RevenueByCategory';
import type { Inventory, Invoice, Order } from '@/types/domain';
import { formatCurrency } from '@/lib/format';

export default function Dashboard() {
  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const [ordersResponse, invoicesResponse, inventoryResponse] = await Promise.all([
        http.get<Order[]>('/api/orders'),
        http.get<Invoice[]>('/api/invoices'),
        http.get<Inventory[]>('/api/inventories')
      ]);
      return {
        orders: ordersResponse.data,
        invoices: invoicesResponse.data,
        inventory: inventoryResponse.data
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
    <div className={styles.wrapper}>
      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span>Ventas totales</span>
          <strong>{metricsQuery.isLoading ? '...' : formatCurrency(metrics.totalSales)}</strong>
        </article>
        <article className={styles.metricCard}>
          <span>Órdenes activas</span>
          <strong>{metricsQuery.isLoading ? '...' : metrics.activeOrders}</strong>
        </article>
        <article className={styles.metricCard}>
          <span>Facturas emitidas</span>
          <strong>{metricsQuery.isLoading ? '...' : metrics.totalInvoices}</strong>
        </article>
        <article className={styles.metricCard}>
          <span>Productos con bajo stock</span>
          <strong>{metricsQuery.isLoading ? '...' : metrics.lowStock}</strong>
        </article>
      </section>
      <section className={styles.chartsGrid}>
        <SalesByDayChart />
        <TopProductsChart />
        <RevenueByCategoryChart />
      </section>
    </div>
  );
}

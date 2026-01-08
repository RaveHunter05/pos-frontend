import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { SalesByDayChart } from '@/components/Charts/SalesByDay';
import { SalesByWeekdayChart } from '@/components/Charts/SalesByWeekday';
import { SalesByPaymentMethodChart } from '@/components/Charts/SalesByPaymentMethod';
import { TopProductsChart } from '@/components/Charts/TopProducts';
import { RevenueByCategoryChart } from '@/components/Charts/RevenueByCategory';
import { InvoiceStatusChart } from '@/components/Charts/InvoiceStatus';
import { DataTable } from '@/components/DataTable';
import { unwrapApiList } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Inventory, Invoice } from '@/types/domain';
import { useApi } from '../hooks/useApi';

type DashboardMetricsResponse = {
  salesToday: number;
  ticketsToday: number;
  averageTicket?: number;
  newCustomers?: number;
};

type TransactionRow = {
  id: number | string;
  date: string;
  amount: number;
  cashier: string;
};

export default function Reports() {
  const { get } = useApi();

  const salesRange = useMemo(() => {
    const to = dayjs();
    return {
      from: to.subtract(6, 'day').format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD')
    };
  }, []);

  const monthRange = useMemo(() => {
    const to = dayjs();
    return {
      from: to.startOf('month').format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD')
    };
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['reports', 'dashboard-metrics'],
    queryFn: async () => {
      try {
        const response = await get('/api/reports/dashboard');
        return response as DashboardMetricsResponse;
      } catch {
        return null;
      }
    }
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'count'],
    queryFn: async () => {
      const response = await get('/api/products');
      return response as unknown;
    }
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventories'],
    queryFn: async () => {
      const response = await get<Inventory[]>('/api/inventories');
      return response;
    }
  });

  const invoicesQuery = useQuery({
    queryKey: ['reports', 'latest-transactions'],
    queryFn: async () => {
      const response = await get('/api/invoices');
      return unwrapApiList<Invoice>(response);
    }
  });

  const kpis = useMemo(() => {
    const productsRaw = productsQuery.data;
    const productsCount =
      productsRaw && typeof productsRaw === 'object' && 'totalElements' in (productsRaw as any)
        ? Number((productsRaw as any).totalElements ?? 0)
        : unwrapApiList<unknown>(productsRaw).length;

    const lowStockCount = inventoryQuery.data?.filter((item) => (item.quantity ?? 0) < 10).length ?? 0;

    const invoices = invoicesQuery.data ?? [];
    const today = dayjs();
    const todaysInvoices = invoices.filter((invoice) => {
      const rawDate = (invoice.createdAt ?? invoice.issueDate) as string | undefined;
      if (!rawDate) return false;
      return dayjs(rawDate).isSame(today, 'day');
    });

    const fallbackSalesToday = todaysInvoices
      .filter((invoice) => invoice.status !== 'CANCELLED')
      .reduce((acc, invoice) => acc + (invoice.totalAmount ?? (invoice as any).total ?? 0), 0);

    const fallbackTicketsToday = todaysInvoices.filter((invoice) => invoice.status !== 'CANCELLED').length;

    return {
      salesToday: dashboardQuery.data?.salesToday ?? fallbackSalesToday,
      ticketsToday: dashboardQuery.data?.ticketsToday ?? fallbackTicketsToday,
      totalProducts: productsCount,
      lowStock: lowStockCount,
      averageTicket: dashboardQuery.data?.averageTicket,
      newCustomers: dashboardQuery.data?.newCustomers
    };
  }, [dashboardQuery.data, inventoryQuery.data, invoicesQuery.data, productsQuery.data]);

  const latestTransactions = useMemo<TransactionRow[]>(() => {
    const invoices = invoicesQuery.data ?? [];

    return invoices
      .slice()
      .sort((a, b) => {
        const aRaw = (a.createdAt ?? a.issueDate) as string | undefined;
        const bRaw = (b.createdAt ?? b.issueDate) as string | undefined;
        const aDate = aRaw ? dayjs(aRaw).valueOf() : 0;
        const bDate = bRaw ? dayjs(bRaw).valueOf() : 0;
        return bDate - aDate;
      })
      .slice(0, 10)
      .map((invoice) => {
        const anyInvoice = invoice as any;
        const rawDate = (invoice.createdAt ?? invoice.issueDate) as string | undefined;
        const cashier =
          anyInvoice.cashierName ?? anyInvoice.cashier?.name ?? anyInvoice.user?.name ?? anyInvoice.createdBy?.name ?? 'N/D';

        return {
          id: invoice.id ?? anyInvoice.number ?? anyInvoice.invoiceNumber ?? '—',
          date: rawDate ? formatDateTime(rawDate) : '—',
          amount: invoice.totalAmount ?? anyInvoice.total ?? 0,
          cashier
        };
      });
  }, [invoicesQuery.data]);

  const rangeLabel = useMemo(
    () => `${dayjs(salesRange.from).format('DD/MM/YYYY')} - ${dayjs(salesRange.to).format('DD/MM/YYYY')}`,
    [salesRange.from, salesRange.to]
  );

  const salesKpiLoading = !dashboardQuery.data && dashboardQuery.isFetching && !invoicesQuery.data && invoicesQuery.isFetching;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Reportes</h2>
        <p className="text-gray-600">Últimos 7 días: {rangeLabel}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Ventas de hoy</span>
          <strong className="text-2xl font-bold text-gray-900">
            {salesKpiLoading ? '...' : formatCurrency(kpis.salesToday)}
          </strong>
        </article>

        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Transacciones de hoy</span>
          <strong className="text-2xl font-bold text-gray-900">{salesKpiLoading ? '...' : kpis.ticketsToday}</strong>
        </article>

        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Total productos (SKUs)</span>
          <strong className="text-2xl font-bold text-gray-900">
            {productsQuery.isFetching && !productsQuery.data ? '...' : kpis.totalProducts}
          </strong>
        </article>

        <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <span className="text-sm text-gray-600 block mb-2">Alerta de stock (stock &lt; 10)</span>
          <strong className="text-2xl font-bold text-gray-900">
            {inventoryQuery.isFetching && !inventoryQuery.data ? '...' : kpis.lowStock}
          </strong>
        </article>
      </section>

      {(kpis.averageTicket != null || kpis.newCustomers != null) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpis.averageTicket != null && (
            <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Ticket promedio (hoy)</span>
              <strong className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.averageTicket)}</strong>
            </article>
          )}
          {kpis.newCustomers != null && (
            <article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <span className="text-sm text-gray-600 block mb-2">Clientes nuevos (hoy)</span>
              <strong className="text-2xl font-bold text-gray-900">{kpis.newCustomers}</strong>
            </article>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <SalesByDayChart from={salesRange.from} to={salesRange.to} title="Tendencia de ventas (7 días)" />
        <SalesByWeekdayChart from={monthRange.from} to={monthRange.to} title="Ventas por día de la semana (mes)" />
        <SalesByPaymentMethodChart from={monthRange.from} to={monthRange.to} title="Ventas por método de pago (mes)" />
        <TopProductsChart
          from={monthRange.from}
          to={monthRange.to}
          title="Top 5 productos más vendidos (mes)"
          metric="quantity"
          limit={5}
        />
        <RevenueByCategoryChart from={monthRange.from} to={monthRange.to} title="Ingresos por categoría (mes)" />
        <InvoiceStatusChart from={monthRange.from} to={monthRange.to} title="Estado de facturas (mes)" />
      </section>

      <section className="flex flex-col gap-3">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Últimas transacciones</h3>
          <span className="text-sm text-gray-500">Top 10</span>
        </header>
        <DataTable
          data={latestTransactions}
          isLoading={invoicesQuery.isFetching && !invoicesQuery.data}
          emptyState="No hay transacciones registradas"
          columns={[
            { key: 'date', header: 'Fecha' },
            { key: 'amount', header: 'Monto', render: (row) => formatCurrency(row.amount) },
            { key: 'cashier', header: 'Cajero' }
          ]}
        />
      </section>
    </div>
  );
}


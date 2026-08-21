import { useMemo, useState } from 'react';
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
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	useComboboxAnchor,
} from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

const rangesSelect = [
	{ name: 'Diario', value: 'DAILY' },
	{ name: 'Semanal', value: 'WEEKLY' },
	{ name: 'Mensual', value: 'MONTHLY' },
	{ name: 'Custom', value: 'CUSTOM' },
];

export default function Reports() {
	const { get } = useApi();

	const rangeAnchor = useComboboxAnchor();

	const salesRange = useMemo(() => {
		const to = dayjs();
		return {
			from: to.subtract(6, 'day').format('YYYY-MM-DD'),
			to: to.format('YYYY-MM-DD'),
		};
	}, []);

	const [selectedRange, setSelectedRange] = useState();

	const [reportParams, setReportParams] = useState<{
		reportType: string;
		fromDate?: string;
		toDate?: string;
	} | null>(null);

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const monthRange = useMemo(() => {
		const to = dayjs();
		return {
			from: to.startOf('month').format('YYYY-MM-DD'),
			to: to.format('YYYY-MM-DD'),
		};
	}, []);

	const dashboardQuery = useQuery({
		queryKey: ['reports', 'dashboard-metrics', reportParams],
		queryFn: async () => {
			try {
				console.log('DASHBOARD: executing dashboard');
				console.log({ reportParams });

				const params: any = {
					reportType: reportParams?.reportType || 'DAILY',
				};

				// Solo enviamos las fechas si es CUSTOM
				if (reportParams?.reportType === 'CUSTOM') {
					params.fromDate = reportParams.fromDate;
					params.toDate = reportParams.toDate;
				}
				const response = await get('/api/reports/dashboard', { params });
				console.log({ response });
				return response as DashboardMetricsResponse;
			} catch {
				return null;
			}
		},
	});

	const handleGenerateReport = () => {
		setReportParams({
			reportType: selectedRange?.value || 'DAILY',
		});
	};

	const handleGenerateCustomReport = () => {
		if (!startDate || !endDate) {
			alert('Debes seleccionar fecha de inicio y fecha de fin');
			return;
		}

		console.log('CUSTOM REPORT');

		setReportParams({
			reportType: 'CUSTOM',
			fromDate: startDate,
			toDate: endDate,
		});
	};

	const productsQuery = useQuery({
		queryKey: ['products', 'count'],
		queryFn: async () => {
			const response = await get('/api/products');
			return response as unknown;
		},
	});

	const inventoryQuery = useQuery({
		queryKey: ['inventories'],
		queryFn: async () => {
			const response = await get<Inventory[]>('/api/inventories');
			return response;
		},
	});

	const invoicesQuery = useQuery({
		queryKey: ['reports', 'latest-transactions'],
		queryFn: async () => {
			const response = await get('/api/invoices');
			return unwrapApiList<Invoice>(response);
		},
	});

	const kpis = useMemo(() => {
		const productsRaw = productsQuery.data;
		const productsCount =
			productsRaw &&
				typeof productsRaw === 'object' &&
				'totalElements' in (productsRaw as any)
				? Number((productsRaw as any).totalElements ?? 0)
				: unwrapApiList<unknown>(productsRaw).length;

		const lowStockCount =
			inventoryQuery.data?.filter((item) => (item.quantity ?? 0) < 10).length ??
			0;

		const invoices = invoicesQuery.data ?? [];
		const today = dayjs();
		const todaysInvoices = invoices.filter((invoice) => {
			const rawDate = (invoice.createdAt ?? invoice.issueDate) as
				| string
				| undefined;
			if (!rawDate) return false;
			return dayjs(rawDate).isSame(today, 'day');
		});

		const fallbackSalesToday = todaysInvoices
			.filter((invoice) => invoice.status !== 'CANCELLED')
			.reduce(
				(acc, invoice) =>
					acc + (invoice.totalAmount ?? (invoice as any).total ?? 0),
				0,
			);

		const fallbackTicketsToday = todaysInvoices.filter(
			(invoice) => invoice.status !== 'CANCELLED',
		).length;

		return {
			salesToday: dashboardQuery.data?.totalSells ?? fallbackSalesToday,
			ticketsToday: dashboardQuery.data?.ticketsToday ?? fallbackTicketsToday,
			utility: dashboardQuery.data?.utility,
			totalProducts: dashboardQuery.data?.quantity,
			lowStock: lowStockCount,
			averageTicket: dashboardQuery.data?.averageTicket,
			newCustomers: dashboardQuery.data?.newCustomers,
		};
	}, [
		dashboardQuery.data,
		inventoryQuery.data,
		invoicesQuery.data,
		productsQuery.data,
	]);

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
				const rawDate = (invoice.createdAt ?? invoice.issueDate) as
					| string
					| undefined;
				const cashier =
					anyInvoice.cashierName ??
					anyInvoice.cashier?.name ??
					anyInvoice.user?.name ??
					anyInvoice.createdBy?.name ??
					'N/D';

				return {
					id:
						invoice.id ?? anyInvoice.number ?? anyInvoice.invoiceNumber ?? '—',
					date: rawDate ? formatDateTime(rawDate) : '—',
					amount: invoice.totalAmount ?? anyInvoice.total ?? 0,
					cashier,
				};
			});
	}, [invoicesQuery.data]);

	const salesKpiLoading =
		!dashboardQuery.data &&
		dashboardQuery.isFetching &&
		!invoicesQuery.data &&
		invoicesQuery.isFetching;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-gray-900">Reportes</h2>

				<div className="flex justify-center items-center space-x-5">
					<div ref={rangeAnchor} className="w-full cursor-pointer">
						<Combobox
							items={rangesSelect}
							value={selectedRange}
							onValueChange={setSelectedRange}
						>
							<ComboboxInput
								placeholder="Seleccione un rango"
								value={selectedRange?.name}
								readOnly
							/>

							<ComboboxContent anchor={rangeAnchor}>
								<ComboboxList>
									{(item) => (
										<ComboboxItem key={item.value} value={item}>
											{item?.name}
										</ComboboxItem>
									)}
								</ComboboxList>
							</ComboboxContent>
						</Combobox>
					</div>
					{selectedRange?.value === 'CUSTOM' ? (
						<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
							<div>
								<label>Fecha Inicio</label>
								<Input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>

							<div>
								<label>Fecha Fin</label>
								<Input
									type="date"
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								/>
							</div>

							<Button
								className="bg-red-500 hover:bg-red-400 cursor-pointer"
								onClick={handleGenerateCustomReport}
							>
								Generar Reporte
							</Button>
						</div>
					) : (
						<Button
							className="bg-red-500 hover:bg-red-400 cursor-pointer"
							onClick={handleGenerateReport}
						>
							Generar Reporte
						</Button>
					)}
				</div>
			</header>

			<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
					<span className="text-sm text-gray-600 block mb-2">
						Ventas de hoy
					</span>
					<strong className="text-2xl font-bold text-gray-900">
						{salesKpiLoading ? '...' : formatCurrency(kpis.salesToday)}
					</strong>
				</article>

				<article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
					<span className="text-sm text-gray-600 block mb-2">
						Transacciones de hoy
					</span>
					<strong className="text-2xl font-bold text-gray-900">
						{salesKpiLoading ? '...' : kpis.ticketsToday}
					</strong>
				</article>

				<article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
					<span className="text-sm text-gray-600 block mb-2">
						Total productos vendidos
					</span>
					<strong className="text-2xl font-bold text-gray-900">
						{productsQuery.isFetching && !productsQuery.data
							? '...'
							: kpis.totalProducts || 0}
					</strong>
				</article>

				<article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
					<span className="text-sm text-gray-600 block mb-2">Utilidad</span>
					<strong className="text-2xl font-bold text-gray-900">
						{inventoryQuery.isFetching && !inventoryQuery.data
							? '...'
							: kpis.utility}
					</strong>
				</article>
			</section>

			{(kpis.averageTicket != null || kpis.newCustomers != null) && (
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{kpis.averageTicket != null && (
						<article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
							<span className="text-sm text-gray-600 block mb-2">
								Ticket promedio (hoy)
							</span>
							<strong className="text-2xl font-bold text-gray-900">
								{formatCurrency(kpis.averageTicket)}
							</strong>
						</article>
					)}
					{kpis.newCustomers != null && (
						<article className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
							<span className="text-sm text-gray-600 block mb-2">
								Clientes nuevos (hoy)
							</span>
							<strong className="text-2xl font-bold text-gray-900">
								{kpis.newCustomers}
							</strong>
						</article>
					)}
				</section>
			)}

			<section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				<SalesByDayChart
					from={salesRange.from}
					to={salesRange.to}
					title="Tendencia de ventas (7 días)"
				/>
				<SalesByWeekdayChart
					from={monthRange.from}
					to={monthRange.to}
					title="Ventas por día de la semana (mes)"
				/>
				<SalesByPaymentMethodChart
					from={monthRange.from}
					to={monthRange.to}
					title="Ventas por método de pago (mes)"
				/>
				<TopProductsChart
					from={monthRange.from}
					to={monthRange.to}
					title="Top 5 productos más vendidos (mes)"
					metric="quantity"
					limit={5}
				/>
				<RevenueByCategoryChart
					from={monthRange.from}
					to={monthRange.to}
					title="Ingresos por categoría (mes)"
				/>
				<InvoiceStatusChart
					from={monthRange.from}
					to={monthRange.to}
					title="Estado de facturas (mes)"
				/>
			</section>

			<section className="flex flex-col gap-3">
				<header className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">
						Últimas transacciones
					</h3>
					<span className="text-sm text-gray-500">Top 10</span>
				</header>
				<DataTable
					data={latestTransactions}
					isLoading={invoicesQuery.isFetching && !invoicesQuery.data}
					emptyState="No hay transacciones registradas"
					columns={[
						{ key: 'date', header: 'Fecha' },
						{
							key: 'amount',
							header: 'Monto',
							render: (row) => formatCurrency(row.amount),
						},
						{ key: 'cashier', header: 'Cajero' },
					]}
				/>
			</section>
		</div>
	);
}

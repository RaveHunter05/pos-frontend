import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Inventory, PageResponse } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { useApi } from '../hooks/useApi';
import { GetInventories } from '@/types/dtos/Inventory';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export default function Inventory() {
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	const [adjustments, setAdjustments] = useState<Record<number, number>>({});
	const queryClient = useQueryClient();

	const [currentPage, setCurrentPage] = useState(0);

	const [totalPages, setTotalPages] = useState(0);
	const { get, put } = useApi();

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
		}, 600);

		return () => clearTimeout(timer);
	}, [search]);

	const generateInventoryReport = async () => {
		const pdfBlob = await get('/api/inventories/report/pdf', {
			responseType: 'blob',
		});

		// Descargar el PDF
		const url = window.URL.createObjectURL(pdfBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `Inventory_report_${new Date().toISOString().slice(0, 10)}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	const inventoryQuery = useQuery({
		queryKey: ['inventories', currentPage, debouncedSearch],
		queryFn: async () => {
			const response = await get<PageResponse<GetInventories>>(
				'/api/inventories',
				{
					params: {
						page: currentPage,
						searchParam: debouncedSearch.trim(),
					},
				},
			);

			setTotalPages(response.totalPages);
			console.log({ response });
			return response.content;
		},
		enabled: debouncedSearch.trim().length > 0,
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
			const body = { quantity };
			console.log({ body });

			toast.promise(put(`/api/inventories/${id}`, body), {
				loading: 'Actualizando producto...',
				success: <b>Inventario actualizado exitosamente</b>,
				error: <b>Error: No se pudo actualizar inventario</b>,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['inventories'] });
		},
	});

	const filteredInventory = useMemo(() => {
		if (!inventoryQuery.data) return [];
		if (!search.trim()) return inventoryQuery.data;
		//@TODO change to normality
		return inventoryQuery.data;
	}, [inventoryQuery.data, search]);

	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-gray-900">Inventario</h2>
				<div>
					<Button
						className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-3 cursor-pointer"
						onClick={generateInventoryReport}
					>
						Generar Informe de Inventario
					</Button>
					<input
						type="search"
						placeholder="Buscar producto"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
					/>
				</div>
			</header>
			<DataTable
				data={filteredInventory}
				isLoading={inventoryQuery.isFetching}
				emptyState="No hay inventario registrado"
				columns={[
					{
						key: 'product',
						header: 'Producto',
						render: (item) => item.name,
					},
					{ key: 'sku', header: 'SKU', render: (item) => item.sku },
					{ key: 'quantity', header: 'Cantidad Disponible' },
					{ key: 'minStock', header: 'Mínimo' },
					{ key: 'maxStock', header: 'Máximo' },
					{
						key: 'location',
						header: 'Ubicación',
						render: (item) => item.location ?? '—',
					},
					{
						key: 'actions',
						header: 'Ajustar',
						render: (item) => (
							<div className="flex gap-2 items-center">
								<input
									type="number"
									className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
									value={adjustments[item.id] ?? item.quantity}
									onChange={(event) =>
										setAdjustments((prev) => ({
											...prev,
											[item.id]: Number(event.target.value),
										}))
									}
								/>
								<button
									type="button"
									className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
									disabled={updateMutation.isPending}
									onClick={() =>
										updateMutation.mutate({
											id: item.id,
											quantity: adjustments[item.id] ?? item.quantity,
										})
									}
								>
									Agregar
								</button>
							</div>
						),
					},
				]}
			/>
			{/* @TODO: crear un solo componente*/}
			<section className="mt-6 flex items-center justify-end gap-3">
				<button
					disabled={currentPage === 0}
					onClick={() => setCurrentPage(currentPage - 1)}
					className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer"
				>
					Anterior
				</button>
				<div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
					<span className="text-slate-500">Página</span>
					<span className="font-semibold text-slate-900">
						{currentPage + 1}
					</span>
					<span className="text-slate-500">de</span>
					<span className="font-semibold text-slate-900">
						{totalPages || 1}
					</span>
				</div>
				<button
					disabled={currentPage >= totalPages - 1}
					onClick={() => setCurrentPage(currentPage + 1)}
					className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 cursor-pointer"
				>
					Siguiente
				</button>
			</section>
		</div>
	);
}

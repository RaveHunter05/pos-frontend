import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Inventory } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { buildFormBody } from '@/lib/forms';
import { useApi } from '../hooks/useApi';
import { GetInventories } from '@/types/dtos/Inventory';
import toast from 'react-hot-toast';

export default function Inventory() {
	const [search, setSearch] = useState('');
	const [adjustments, setAdjustments] = useState<Record<number, number>>({});
	const queryClient = useQueryClient();
	const { get, put } = useApi();

	const inventoryQuery = useQuery({
		queryKey: ['inventories'],
		queryFn: async () => {
			const response = await get<GetInventories[]>('/api/inventories');
			return response;
		},
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
		const normalized = search.trim().toLowerCase();
		return inventoryQuery.data.filter((item) =>
			[item.name, item.sku, item.barCode]
				.filter(Boolean)
				.some((value) => value!.toLowerCase().includes(normalized)),
		);
	}, [inventoryQuery.data, search]);

	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-gray-900">Inventario</h2>
				<input
					type="search"
					placeholder="Buscar producto"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
				/>
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
		</div>
	);
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { buildFormBody } from '@/lib/forms';
import { useApi } from '../hooks/useApi';

const categorySchema = z.object({
	name: z.string().min(3, 'El nombre es obligatorio'),
	description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function Categories() {
	const [editing, setEditing] = useState<Category | null>(null);

	const { get, post, put, apiDelete } = useApi();

	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<CategoryFormValues>({
		resolver: zodResolver(categorySchema),
	});

	const categoriesQuery = useQuery({
		queryKey: ['categories'],
		queryFn: async () => {
			const response = await get('/api/categories');
			return response;
		},
	});

	const upsertMutation = useMutation({
		mutationFn: async (values: CategoryFormValues) => {
			const body = buildFormBody(values);
			if (editing) {
				const response = await put(
					`/api/categories/${editing.id}`,
					body
				);
				return response;
			}
			const response = await post('/api/categories', body);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['categories'] });
			reset();
			setEditing(null);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			await apiDelete(`/api/categories/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['categories'] });
			if (editing?.id) {
				setEditing(null);
				reset();
			}
		},
	});

	const onSubmit = (values: CategoryFormValues) => {
		upsertMutation.mutate(values);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-gray-900">Categorías</h2>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
				<section className="bg-white rounded-xl shadow-sm p-6">
					<DataTable
						data={categoriesQuery.data ?? []}
						isLoading={categoriesQuery.isFetching}
						emptyState="Aún no hay categorías"
						columns={[
							{ key: 'name', header: 'Nombre' },
							{ key: 'description', header: 'Descripción' },
							{
								key: 'createdAt',
								header: 'Creada',
								render: (category) =>
									category.createdAt
										? new Date(category.createdAt).toLocaleDateString('es-NI')
										: '—',
							},
							{
								key: 'actions',
								header: 'Acciones',
								render: (category) => (
									<div className="flex gap-2">
										<button
											type="button"
											onClick={() => {
												setEditing(category);
												reset({
													name: category.name,
													description: category.description,
												});
											}}
											className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
										>
											Editar
										</button>
										<button
											type="button"
											onClick={() => {
												if (window.confirm('¿Eliminar categoría?')) {
													deleteMutation.mutate(category.id);
												}
											}}
											className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
										>
											Eliminar
										</button>
									</div>
								),
							},
						]}
					/>
				</section>
				<section className="bg-white rounded-xl shadow-sm p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						{editing ? 'Editar categoría' : 'Crear categoría'}
					</h3>
					<form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
							<input
								type="text"
								{...register('name')}
								placeholder="Ej. Lácteos"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
							{errors.name && (
								<span className="text-sm text-red-600 mt-1 block">{errors.name.message}</span>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
							<textarea
								rows={3}
								{...register('description')}
								placeholder="Opcional"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>
						<button
							type="submit"
							disabled={upsertMutation.isPending}
							className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{editing ? 'Actualizar' : 'Crear'}
						</button>
						{editing && (
							<button
								type="button"
								onClick={() => {
									setEditing(null);
									reset({ name: '', description: '' });
								}}
								className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
							>
								Cancelar edición
							</button>
						)}
					</form>
				</section>
			</div>
		</div>
	);
}

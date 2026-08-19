import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore } from '@/store/cart';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StoreData } from '@/types/domain';
import { useApi } from '@/hooks/useApi';
import { buildFormBody } from '@/lib/forms';

import toast from 'react-hot-toast';

const settingsSchema = z.object({
	name: z.string().min(1),
	RUC: z.string().optional(),
	taxRate: z
		.number({ invalid_type_error: 'Ingrese un porcentaje válido' })
		.min(0, 'Debe ser positivo')
		.max(100, 'Máximo 100%'),
	phone: z.string().min(1),
	email: z.string().email(),
	currency: z.string().min(1),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function Settings() {
	const { get, put, apiDelete } = useApi();

	const queryClient = useQueryClient();

	const {
		data: config,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['configuration'],
		queryFn: async () => {
			const response = await get<StoreData>('/api/stores/data');
			console.log({ response });
			return response;
		},
	});
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<StoreData>({
		resolver: zodResolver(settingsSchema),
		defaultValues: {
			taxRate: 0,
			currency: 'C$',
		},
	});

	const upsertMutation = useMutation({
		mutationFn: async (values: StoreData) => {
			toast.promise(put('/api/stores', values), {
				loading: 'Saving...',
				success: <b>Info de la tienda actualizada</b>,
				error: <b>Error: No se pudo actualizar la configuracion de la tienda</b>,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['configuration'] });
			reset();
		},
	});

	useEffect(() => {
		if (config) {
			reset(config); // Esto pone los valores por defecto del formulario
		}
	}, [config, reset]);

	const onSubmit = (values: SettingsValues) => {
		upsertMutation.mutate(values);
	};

	return (
		<div className="flex flex-col gap-6">
			<h2 className="text-2xl font-semibold text-gray-900">Configuración</h2>
			<div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
				<form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Nombre de la Tienda
						</label>
						<input
							type="text"
							{...register('name')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
						{errors.name && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.name.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							email
						</label>
						<input
							type="text"
							{...register('email')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
						{errors.email && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.email.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Telefono
						</label>
						<input
							type="text"
							{...register('phone')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
						{errors.phone && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.phone.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							IVA (%)
						</label>
						<input
							type="number"
							step="0.01"
							{...register('taxRate', { valueAsNumber: true })}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
						{errors.taxRate && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.taxRate.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							RUC
						</label>
						<input
							type="text"
							{...register('RUC')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
						{errors.RUC && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.RUC.message}
							</span>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Moneda
						</label>
						<input
							type="text"
							{...register('currency')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>
						{errors.currency && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.currency.message}
							</span>
						)}
					</div>
					<button
						type="submit"
						className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-4"
					>
						Guardar
					</button>
				</form>
			</div>
		</div>
	);
}

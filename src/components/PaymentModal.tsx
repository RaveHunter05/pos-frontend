import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Order } from '@/types/domain';
import { useCartStore, calculateCartTotals } from '@/store/cart';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

const paymentMethods = ['CASH', 'CARD', 'TRANSFER', 'CHECK'] as const;

const paymentSchema = z.object({
	client: z.string().optional(),
	clientPhone: z.string().optional(),
	clientNotes: z.string().optional(),
	deliveryAddress: z.string().optional(),
	deliveryFee: z.coerce
		.number()
		.min(0, 'El costo del delivery debe ser mayor o igual a 0'),
	paymentMethod: z.enum(paymentMethods),
	taxRate: z.coerce
		.number()
		.min(0, 'El impuesto debe ser mayor o igual a 0')
		.optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type PaymentModalProps = {
	open: boolean;
	onClose: () => void;
	onSuccess: (order: Order) => void;
};

export function PaymentModal({ open, onClose, onSuccess }: PaymentModalProps) {
	const queryClient = useQueryClient();
	const { items, taxRate, discount } = useCartStore((state) => ({
		items: state.items,
		taxRate: state.taxRate,
		discount: state.discount,
	}));
	const clear = useCartStore((state) => state.clear);
	const totals = calculateCartTotals({ items, taxRate, discount });
	const { post } = useApi();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<PaymentFormValues>({
		resolver: zodResolver(paymentSchema),
		defaultValues: {
			paymentMethod: 'CASH',
		},
	});

	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};
		if (open) {
			window.addEventListener('keydown', handler);
		}
		return () => window.removeEventListener('keydown', handler);
	}, [open, onClose]);

	const mutation = useMutation({
		mutationFn: async (values: PaymentFormValues) => {
			//@TODO: Agregar descuento a calculo total
			const taxableBase = totals.subtotal > 0 ? totals.subtotal : 1;

			const payload = {
				issueDate: new Date().toISOString().slice(0, 10),
				subtotal: totals.subtotal,
				taxAmount: totals.tax,
				totalAmount: totals.total,
				taxRate: Number(((totals.tax / taxableBase) * 100).toFixed(2)),
				status: 'DRAFT',
				paymentMethod: values.paymentMethod || 'CASH',
				client: values.client,
				clientPhone: values.clientPhone,
				clientNotes: values.clientNotes,
				deliveryFee: values.deliveryFee,
				deliveryAddress: values.deliveryAddress,
				items: items.map((item) => ({
					quantity: item.quantity,
					productId: item.product.product_id,
				})),
			};

			//console.log('Payload enviado:', JSON.stringify(payload, null, 2));

			// @TODO usar toast para el mensaje y gestionar mejor lo de el PDF
			const pdfBlob = await post('/api/orders/generate-invoice', payload, {
				responseType: 'blob',
			});

			// Descargar el PDF
			const url = window.URL.createObjectURL(pdfBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `Factura_${new Date().toISOString().slice(0, 10)}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			return pdfBlob;
		},
		onSuccess: (order) => {
			clear();
			reset();
			queryClient.invalidateQueries({ queryKey: ['orders'] });
			onClose();
		},
	});

	const onSubmit = (values: PaymentFormValues) => {
		if (!items.length) return;
		mutation.mutate(values);
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div
				className="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4 h-9/10 overflow-scroll"
				role="dialog"
				aria-modal="true"
			>
				<header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">
						Confirmar pago
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
					>
						×
					</button>
				</header>
				<form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Cliente
						</label>
						<input
							type="text"
							placeholder="Opcional"
							{...register('client')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>

						{errors.client && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.client.message}
							</span>
						)}

						{errors.taxRate && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.taxRate.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Telefono Cliente
						</label>
						<input
							type="text"
							placeholder="Opcional"
							{...register('clientPhone')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>

						{errors.clientPhone && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.clientPhone.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Direccion de envio
						</label>
						<input
							type="text"
							placeholder="Opcional"
							{...register('deliveryAddress')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>

						{errors.deliveryAddress && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.deliveryAddress.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Precio de envio
						</label>
						<input
							type="text"
							placeholder="Opcional"
							{...register('deliveryFee')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>

						{errors.deliveryFee && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.deliveryFee.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Método de pago
						</label>
						<select
							{...register('paymentMethod')}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						>
							{paymentMethods.map((method) => (
								<option key={method} value={method}>
									{method}
								</option>
							))}
						</select>
						{errors.paymentMethod && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.paymentMethod.message}
							</span>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Notas
						</label>
						<textarea
							rows={3}
							{...register('clientNotes')}
							placeholder="Observaciones opcionales"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
						/>

						{errors.clientNotes && (
							<span className="text-sm text-red-600 mt-1 block">
								{errors.clientNotes.message}
							</span>
						)}
					</div>
					<section className="bg-gray-50 rounded-lg p-4">
						<div className="flex justify-between items-center">
							<span className="text-gray-600">Total a cobrar</span>
							<strong className="text-xl font-bold text-indigo-600">
								{formatCurrency(totals.total)}
							</strong>
						</div>
					</section>
					<footer className="flex gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={mutation.isPending || !items.length}
							className={`flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors disabled:bg-yellow-300`}
						>
							Confirmar y emitir factura
						</button>
					</footer>
				</form>
			</div>
		</div>
	);
}

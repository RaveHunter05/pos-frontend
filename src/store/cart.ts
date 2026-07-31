import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CartItem, ProductInventoryInfo } from '@/types/domain';

export type CartState = {
	items: CartItem[];
	customerName?: string;
	paymentMethod?: string;
	taxRate: number;
	discount: number;
};

export type CartActions = {
	addProduct: (
		product: ProductInventoryInfo,
		maxQuantity: number,
	) => { success: boolean; message?: string };
	updateQuantity: (
		productId: number,
		quantity: number,
		maxQuantity?: number,
	) => { success: boolean; message?: string };
	removeProduct: (productId: number) => void;
	clear: () => void;
	setDiscount: (discount: number) => void;
	setTaxRate: (taxRate: number) => void;
};

//@TODO: Tax Rate configurarlo con los settings de la base de datos

const initialState: CartState = {
	items: [],
	taxRate: 0,
	discount: 0,
};

export const useCartStore = create<CartState & CartActions>()(
	devtools((set, get) => ({
		...initialState,
		addProduct: (product, addQuantity = 1) => {
			const state = get(); // snapshot actual

			const existing = state.items.find(
				(item) => item.product.id === product.id,
			);
			const maxQuantity = product.quantity; // stock disponible

			// Caso 1: Producto ya existe en el carrito
			if (existing) {
				const newQuantity = existing.quantity + addQuantity;

				if (maxQuantity !== undefined && newQuantity > maxQuantity) {
					const available = maxQuantity - existing.quantity;
					return {
						success: false,
						message:
							available > 0
								? `No hay suficiente stock. Puedes agregar máximo ${available} unidades más.`
								: `No hay más stock disponible para este producto`,
					};
				}

				// Actualizar cantidad
				set((currentState) => ({
					...currentState,
					items: currentState.items.map((item) =>
						item.product.id === product.id
							? { ...item, quantity: newQuantity }
							: item,
					),
				}));

				return { success: true };
			}

			// Caso 2: Producto nuevo
			if (maxQuantity !== undefined && maxQuantity < addQuantity) {
				return {
					success: false,
					message: `No hay suficiente stock. Solo hay ${maxQuantity} unidades disponibles.`,
				};
			}

			// Agregar nuevo producto con la cantidad solicitada (por defecto 1)
			set((currentState) => ({
				...currentState,
				items: [
					...currentState.items,
					{ product, maxQuantity: product.quantity, quantity: 1 },
				],
			}));

			return { success: true };
		},
		updateQuantity: (productId, quantity, maxQuantity) => {
			if (quantity <= 0) {
				const state = get();
				set({
					...state,
					items: state.items.filter((item) => item.product.id !== productId),
				});
				return { success: true };
			}

			if (maxQuantity !== undefined && quantity > maxQuantity) {
				return {
					success: false,
					message: `Stock máximo disponible: ${maxQuantity} unidades`,
				};
			}

			const state = get();
			set({
				...state,
				items: state.items.map((item) =>
					item.product.id === productId ? { ...item, quantity } : item,
				),
			});
			return { success: true };
		},
		removeProduct: (productId) =>
			set((state) => ({
				...state,
				items: state.items.filter((item) => item.product.id !== productId),
			})),
		clear: () => set(() => ({ ...initialState })),
		setDiscount: (discount) => set((state) => ({ ...state, discount })),
		setTaxRate: (taxRate) => set((state) => ({ ...state, taxRate })),
	})),
);

export function calculateCartTotals(state: CartState) {
	const subtotal = state.items.reduce(
		(acc, item) => acc + (item.product.sellPrice ?? 0) * item.quantity,
		0,
	);
	const discount = Math.min(state.discount, subtotal);
	const taxable = Math.max(subtotal - discount, 0);
	const tax = state.items.reduce((acc, item) => {
		const rate =
			typeof item.product.taxPercentage === 'number'
				? item.product.taxPercentage / 100
				: state.taxRate;
		const lineSubtotal = (item.product.sellPrice ?? 0) * item.quantity;
		return acc + lineSubtotal * rate;
	}, 0);
	const total = taxable + tax;

	return { subtotal, discount, tax, total };
}

import { create } from 'zustand';
import type { CartItem, Product } from '@/types/domain';

export type CartState = {
  items: CartItem[];
  customerName?: string;
  paymentMethod?: string;
  taxRate: number;
  discount: number;
};

export type CartActions = {
  addProduct: (product: Product) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeProduct: (productId: number) => void;
  clear: () => void;
  setDiscount: (discount: number) => void;
  setTaxRate: (taxRate: number) => void;
};

const initialState: CartState = {
  items: [],
  taxRate: 0.15,
  discount: 0
};

export const useCartStore = create<CartState & CartActions>((set) => ({
  ...initialState,
  addProduct: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return { ...state, items: [...state.items, { product, quantity: 1 }] };
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      ...state,
      items: state.items
        .map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
        .filter((item) => item.quantity > 0)
    })),
  removeProduct: (productId) =>
    set((state) => ({
      ...state,
      items: state.items.filter((item) => item.product.id !== productId)
    })),
  clear: () => set(() => ({ ...initialState })),
  setDiscount: (discount) => set((state) => ({ ...state, discount })),
  setTaxRate: (taxRate) => set((state) => ({ ...state, taxRate }))
}));

export function calculateCartTotals(state: CartState) {
  const subtotal = state.items.reduce(
    (acc, item) => acc + (item.product.costPrice ?? 0) * item.quantity,
    0
  );
  const discount = Math.min(state.discount, subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = state.items.reduce((acc, item) => {
    const rate =
      typeof item.product.taxPercentage === 'number'
        ? item.product.taxPercentage / 100
        : state.taxRate;
    const lineSubtotal = (item.product.costPrice ?? 0) * item.quantity;
    return acc + lineSubtotal * rate;
  }, 0);
  const total = taxable + tax;

  return { subtotal, discount, tax, total };
}

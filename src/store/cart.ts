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
  addProduct: (product: Product, maxQuantity?: number) => { success: boolean; message?: string };
  updateQuantity: (productId: number, quantity: number, maxQuantity?: number) => { success: boolean; message?: string };
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

export const useCartStore = create<CartState & CartActions>((set, get) => ({
  ...initialState,
  addProduct: (product, maxQuantity) => {
    const state = get();
    const existing = state.items.find((item) => item.product.id === product.id);
    
    if (existing) {
      const newQuantity = existing.quantity + 1;
      if (maxQuantity !== undefined && newQuantity > maxQuantity) {
        const available = maxQuantity - existing.quantity;
        return {
          success: false,
          message: available > 0 
            ? `No hay suficiente stock. Puede agregar máximo ${available} unidades más`
            : `No hay más stock disponible para este producto`
        };
      }
      set({
        ...state,
        items: state.items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      });
      return { success: true };
    }
    
    if (maxQuantity !== undefined && maxQuantity < 1) {
      return {
        success: false,
        message: `No hay stock disponible para este producto`
      };
    }
    
    set({ ...state, items: [...state.items, { product, quantity: 1 }] });
    return { success: true };
  },
  updateQuantity: (productId, quantity, maxQuantity) => {
    if (quantity <= 0) {
      const state = get();
      set({
        ...state,
        items: state.items.filter((item) => item.product.id !== productId)
      });
      return { success: true };
    }
    
    if (maxQuantity !== undefined && quantity > maxQuantity) {
      return {
        success: false,
        message: `Stock máximo disponible: ${maxQuantity} unidades`
      };
    }
    
    const state = get();
    set({
      ...state,
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    });
    return { success: true };
  },
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

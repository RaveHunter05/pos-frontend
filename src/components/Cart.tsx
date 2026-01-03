import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore, calculateCartTotals } from '@/store/cart';
import { formatCurrency } from '@/lib/format';
import type { Inventory } from '@/types/domain';
import { useApi } from '../hooks/useApi';
import { Toast } from '@/ui/Toast';

export function Cart({ onCheckout }: { onCheckout: () => void }) {
  const [toast, setToast] = useState<{ message: string; variant?: 'success' | 'error' | 'info' } | null>(null);
  const cartState = useCartStore((state) => ({
    items: state.items,
    discount: state.discount,
    taxRate: state.taxRate
  }));
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const setDiscount = useCartStore((state) => state.setDiscount);
  const totals = calculateCartTotals(cartState);
  const { items, discount } = cartState;
  const { get } = useApi();

  const inventoryQuery = useQuery({
    queryKey: ['inventories'],
    queryFn: async () => {
      const response = await get<Inventory[]>('/api/inventories');
      return response;
    },
    staleTime: 30_000
  });

  const getProductStock = (productId: number): number | null => {
    if (!inventoryQuery.data) return null;
    const inventory = inventoryQuery.data.find((inv) => inv.product.id === productId);
    return inventory?.quantity ?? 0;
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'F7') {
        event.preventDefault();
        onCheckout();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCheckout]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
        event.preventDefault();
        const lastItem = items.length ? items[items.length - 1] : undefined;
        if (lastItem) {
          removeProduct(lastItem.product.id);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, removeProduct]);

  useEffect(() => {
    if (!inventoryQuery.data) return;

    items.forEach((item) => {
      const stock = getProductStock(item.product.id);
      if (stock !== null && item.quantity > stock) {
        updateQuantity(item.product.id, stock, stock);
        setToast({
          message:
            stock > 0
              ? `Cantidad de ${item.product.name} ajustada al stock disponible (${stock})`
              : `${item.product.name} sin stock disponible, se removio del carrito`,
          variant: 'info'
        });
      }
    });
  }, [items, inventoryQuery.data, updateQuantity]);

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-full">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Carrito</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => {
          const stock = getProductStock(item.product.id);
          const available = stock !== null ? stock - item.quantity : null;

          return (
            <div key={item.product.id} className="border border-gray-200 rounded-lg p-3">
              <div className="mb-2">
                <strong className="block text-gray-900">{item.product.name}</strong>
                <span className="text-xs text-gray-500">SKU: {item.product.sku}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={stock ?? undefined}
                    value={item.quantity}
                    onChange={(event) => {
                      const newQuantity = Number(event.target.value);
                      const maxQuantity = getProductStock(item.product.id);

                      if (Number.isNaN(newQuantity)) return;

                      if (maxQuantity === null && newQuantity > 0) {
                        setToast({ message: 'Inventario cargando, intenta en un momento', variant: 'info' });
                        return;
                      }

                      if (maxQuantity !== null && maxQuantity <= 0) {
                        updateQuantity(item.product.id, 0, 0);
                        setToast({ message: 'Producto sin stock, se removio del carrito', variant: 'error' });
                        return;
                      }

                      if (maxQuantity !== null && newQuantity > maxQuantity) {
                        updateQuantity(item.product.id, maxQuantity, maxQuantity);
                        setToast({
                          message: `Cantidad ajustada al maximo disponible: ${maxQuantity} unidades`,
                          variant: 'info'
                        });
                        return;
                      }

                      const result = updateQuantity(
                        item.product.id,
                        newQuantity,
                        maxQuantity === null ? undefined : maxQuantity
                      );
                      if (!result.success && result.message) {
                        setToast({ message: result.message, variant: 'error' });
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeProduct(item.product.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Quitar
                  </button>
                  <span className="ml-auto font-semibold text-gray-900">
                    {formatCurrency((item.product.costPrice ?? 0) * item.quantity)}
                  </span>
                </div>
                {stock !== null && (
                  <div className="text-xs text-gray-500">
                    Stock total: {stock} | Disponible despues: {available !== null && available >= 0 ? available : 0}
                    {available !== null && available < 0 && (
                      <span className="text-red-600 font-semibold ml-1">(Excede stock)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!items.length && (
          <div className="text-center text-gray-500 py-8">No hay productos en el carrito.</div>
        )}
      </div>
      <div className="border-t border-gray-200 p-4 space-y-3">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Descuento global (C$)</span>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(event) => setDiscount(Number(event.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </label>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <strong className="text-gray-900">{formatCurrency(totals.subtotal)}</strong>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Descuento</span>
          <strong className="text-gray-900">-{formatCurrency(totals.discount)}</strong>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Impuestos</span>
          <strong className="text-gray-900">{formatCurrency(totals.tax)}</strong>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <strong className="text-indigo-600">{formatCurrency(totals.total)}</strong>
        </div>
        <button
          type="button"
          onClick={onCheckout}
          disabled={!items.length}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cobrar (F7)
        </button>
      </div>
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </div>
  );
}

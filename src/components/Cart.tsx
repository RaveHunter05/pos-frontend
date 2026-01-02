import { useEffect } from 'react';
import { useCartStore, calculateCartTotals } from '@/store/cart';
import { formatCurrency } from '@/lib/format';

export function Cart({ onCheckout }: { onCheckout: () => void }) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-full">
      <header className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Carrito</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => (
          <div key={item.product.id} className="border border-gray-200 rounded-lg p-3">
            <div className="mb-2">
              <strong className="block text-gray-900">{item.product.name}</strong>
              <span className="text-xs text-gray-500">SKU: {item.product.sku}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
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
          </div>
        ))}
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
    </div>
  );
}

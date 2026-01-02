import { useEffect } from 'react';
import { useCartStore, calculateCartTotals } from '@/store/cart';
import styles from './Cart.module.css';
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
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Carrito</h2>
      </header>
      <div className={styles.items}>
        {items.map((item) => (
          <div key={item.product.id} className={styles.item}>
            <div>
              <strong>{item.product.name}</strong>
              <span className={styles.meta}>SKU: {item.product.sku}</span>
            </div>
            <div className={styles.controls}>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
              />
              <button type="button" onClick={() => removeProduct(item.product.id)}>
                Quitar
              </button>
              <span className={styles.price}>{formatCurrency((item.product.costPrice ?? 0) * item.quantity)}</span>
            </div>
          </div>
        ))}
        {!items.length && <div className={styles.empty}>No hay productos en el carrito.</div>}
      </div>
      <div className={styles.summary}>
        <label>
          Descuento global (C$)
          <input type="number" min={0} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
        </label>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <strong>{formatCurrency(totals.subtotal)}</strong>
        </div>
        <div className={styles.totalRow}>
          <span>Descuento</span>
          <strong>-{formatCurrency(totals.discount)}</strong>
        </div>
        <div className={styles.totalRow}>
          <span>Impuestos</span>
          <strong>{formatCurrency(totals.tax)}</strong>
        </div>
        <div className={styles.grandTotal}>
          <span>Total</span>
          <strong>{formatCurrency(totals.total)}</strong>
        </div>
        <button className={styles.checkout} type="button" onClick={onCheckout} disabled={!items.length}>
          Cobrar (F7)
        </button>
      </div>
    </div>
  );
}

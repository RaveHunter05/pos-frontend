import { forwardRef } from 'react';
import type { Invoice } from '@/types/domain';
import styles from './Receipt80mm.module.css';
import { formatCurrency, formatDateTime } from '@/lib/format';

type Receipt80mmProps = {
  invoice: Invoice;
};

export const Receipt80mm = forwardRef<HTMLDivElement, Receipt80mmProps>(({ invoice }, ref) => {
  return (
    <div ref={ref} className={styles.ticket}>
      <h1>POS PyME</h1>
      <p>Factura #{invoice.invoiceNumber}</p>
      <p>Fecha: {formatDateTime(invoice.createdAt ?? invoice.issueDate)}</p>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cant</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.invoiceItems.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr />
      <div className={styles.totals}>
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(invoice.subtotal)}</strong>
        </div>
        <div>
          <span>Impuestos</span>
          <strong>{formatCurrency(invoice.taxAmount)}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{formatCurrency(invoice.totalAmount)}</strong>
        </div>
        <div>
          <span>Pago</span>
          <strong>{invoice.paymentMethod}</strong>
        </div>
      </div>
      <p className={styles.footer}>Gracias por su compra</p>
    </div>
  );
});

Receipt80mm.displayName = 'Receipt80mm';

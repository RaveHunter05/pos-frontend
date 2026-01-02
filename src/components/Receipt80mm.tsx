import { forwardRef } from 'react';
import type { Invoice } from '@/types/domain';
import { formatCurrency, formatDateTime } from '@/lib/format';

type Receipt80mmProps = {
  invoice: Invoice;
};

export const Receipt80mm = forwardRef<HTMLDivElement, Receipt80mmProps>(({ invoice }, ref) => {
  return (
    <div ref={ref} className="w-80 mx-auto p-4 font-mono text-sm" style={{ fontFamily: 'monospace' }}>
      <h1 className="text-center text-xl font-bold mb-2">POS PyME</h1>
      <p className="text-center mb-1">Factura #{invoice.invoiceNumber}</p>
      <p className="text-center mb-4">Fecha: {formatDateTime(invoice.createdAt ?? invoice.issueDate)}</p>
      <hr className="border-gray-300 my-4" />
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-1">Descripción</th>
            <th className="text-center py-1">Cant</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.invoiceItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-1">{item.description}</td>
              <td className="text-center py-1">{item.quantity}</td>
              <td className="text-right py-1">{formatCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="border-gray-300 my-4" />
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <strong>{formatCurrency(invoice.subtotal)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Impuestos</span>
          <strong>{formatCurrency(invoice.taxAmount)}</strong>
        </div>
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <strong>{formatCurrency(invoice.totalAmount)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Pago</span>
          <strong>{invoice.paymentMethod}</strong>
        </div>
      </div>
      <p className="text-center mt-4 text-xs">Gracias por su compra</p>
    </div>
  );
});

Receipt80mm.displayName = 'Receipt80mm';

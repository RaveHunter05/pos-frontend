import { useRef, useState } from 'react';
import { ProductSearch } from '@/components/ProductSearch';
import { Cart } from '@/components/Cart';
import { PaymentModal } from '@/components/PaymentModal';
import { Receipt80mm } from '@/components/Receipt80mm';
import type { Invoice } from '@/types/domain';
import { useCartStore } from '@/store/cart';

export default function Pos() {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const clearCart = useCartStore((state) => state.clear);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', 'PRINT', 'height=600,width=400');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Ticket</title>');
        printWindow.document.write('<style>body{font-family:monospace;padding:16px;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(receiptRef.current.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      <section className="flex flex-col gap-6">
        <ProductSearch />
        {lastInvoice ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Última factura</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600"><strong>ID:</strong> {lastInvoice.id}</p>
              <p className="text-sm text-gray-600"><strong>Número:</strong> {lastInvoice.invoiceNumber}</p>
              <p className="text-sm text-gray-600"><strong>Estado:</strong> {lastInvoice.status}</p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Imprimir ticket
            </button>
          </div>
        ) : (
          <p className="text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
            Agregue productos y presione Cobrar para emitir la factura.
          </p>
        )}
        <div style={{ display: 'none' }}>
          {lastInvoice && <Receipt80mm ref={receiptRef} invoice={lastInvoice} />}
        </div>
      </section>
      <section>
        <Cart onCheckout={() => setPaymentOpen(true)} />
      </section>
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={(invoice) => {
          setLastInvoice(invoice);
          setPaymentOpen(false);
          clearCart();
        }}
      />
    </div>
  );
}

import { useRef, useState } from 'react';
import styles from './Pos.module.css';
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
    <div className={styles.layout}>
      <section className={styles.leftPane}>
        <ProductSearch />
        {lastInvoice ? (
          <div className={styles.invoiceResult}>
            <h3>Última factura</h3>
            <p>ID: {lastInvoice.id}</p>
            <p>Número: {lastInvoice.invoiceNumber}</p>
            <p>Estado: {lastInvoice.status}</p>
            <button type="button" onClick={handlePrint}>
              Imprimir ticket
            </button>
          </div>
        ) : (
          <p className={styles.helper}>Agregue productos y presione Cobrar para emitir la factura.</p>
        )}
        <div style={{ display: 'none' }}>
          {lastInvoice && <Receipt80mm ref={receiptRef} invoice={lastInvoice} />}
        </div>
      </section>
      <section className={styles.rightPane}>
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

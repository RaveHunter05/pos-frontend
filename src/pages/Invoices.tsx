import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http';
import type { Invoice } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import styles from './Invoices.module.css';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

export default function Invoices() {
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await http.get<Invoice[]>('/api/invoices');
      return response.data;
    }
  });

  const filteredInvoices = useMemo(() => {
    if (!invoicesQuery.data) return [];
    if (!status) return invoicesQuery.data;
    return invoicesQuery.data.filter((invoice) => invoice.status === status);
  }, [invoicesQuery.data, status]);

  useEffect(() => {
    if (!filteredInvoices.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredInvoices.some((invoice) => invoice.id === selectedId)) {
      setSelectedId(filteredInvoices[0].id);
    }
  }, [filteredInvoices, selectedId]);

  const selectedInvoice = useMemo(() => {
    if (!filteredInvoices.length) return null;
    return filteredInvoices.find((invoice) => invoice.id === selectedId) ?? filteredInvoices[0];
  }, [filteredInvoices, selectedId]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Facturas</h2>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos</option>
          <option value="PAID">Pagadas</option>
          <option value="ISSUED">Emitidas</option>
          <option value="DRAFT">Borrador</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </header>
      <div className={styles.content}>
        <div className={styles.list}>
          <DataTable
            data={filteredInvoices}
            isLoading={invoicesQuery.isFetching}
            emptyState="No hay facturas registradas"
            columns={[
              { key: 'invoiceNumber', header: 'Número' },
              {
                key: 'issueDate',
                header: 'Fecha',
                render: (invoice) => formatDate(invoice.issueDate)
              },
              {
                key: 'totalAmount',
                header: 'Total',
                render: (invoice) => formatCurrency(invoice.totalAmount)
              },
              { key: 'status', header: 'Estado' }
            ]}
          />
        </div>
        <aside className={styles.detail}>
          <h3>Detalle</h3>
          {!selectedInvoice && <p>Seleccione una factura para ver el detalle.</p>}
          <ul className={styles.invoiceList}>
            {filteredInvoices.map((invoice) => (
              <li key={invoice.id}>
                <button type="button" onClick={() => setSelectedId(invoice.id)} className={selectedInvoice?.id === invoice.id ? styles.selected : ''}>
                  {invoice.invoiceNumber}
                </button>
              </li>
            ))}
          </ul>
          {selectedInvoice && (
            <div className={styles.invoiceDetail}>
              <p><strong>Factura:</strong> {selectedInvoice.invoiceNumber}</p>
              <p><strong>Fecha emisión:</strong> {formatDate(selectedInvoice.issueDate)}</p>
              <p><strong>Estado:</strong> {selectedInvoice.status}</p>
              <p><strong>Método de pago:</strong> {selectedInvoice.paymentMethod}</p>
              <p><strong>Total:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p>
              <p><strong>Creada:</strong> {formatDateTime(selectedInvoice.createdAt)}</p>
              <h4>Productos</h4>
              <ul>
                {selectedInvoice.invoiceItems.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.description} — {formatCurrency(item.totalPrice)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

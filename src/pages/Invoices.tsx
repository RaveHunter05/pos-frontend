import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Invoice } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { useApi } from '../hooks/useApi';

export default function Invoices() {
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { get, apiDelete } = useApi();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await get<Invoice[]>('/api/invoices');
      return response;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiDelete(`/api/invoices/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (selectedId === id) {
        setSelectedId(null);
    }
    },
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
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Facturas</h2>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos</option>
          <option value="PAID">Pagadas</option>
          <option value="ISSUED">Emitidas</option>
          <option value="DRAFT">Borrador</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
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
              { key: 'status', header: 'Estado' },
              {
                key: 'actions',
                header: 'Acciones',
                render: (invoice) => (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Eliminar factura?')) {
                        deleteMutation.mutate(invoice.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Eliminar
                  </button>
                )
              }
            ]}
          />
        </div>
        <aside className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle</h3>
          {!selectedInvoice && <p className="text-gray-600">Seleccione una factura para ver el detalle.</p>}
          <ul className="list-none p-0 m-0 flex flex-col gap-2 mb-4">
            {filteredInvoices.map((invoice) => (
              <li key={invoice.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(invoice.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedInvoice?.id === invoice.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-transparent border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {invoice.invoiceNumber}
                </button>
              </li>
            ))}
          </ul>
          {selectedInvoice && (
            <div className="flex flex-col gap-2">
              <p className="text-sm"><strong>Factura:</strong> {selectedInvoice.invoiceNumber}</p>
              <p className="text-sm"><strong>Fecha emisión:</strong> {formatDate(selectedInvoice.issueDate)}</p>
              <p className="text-sm"><strong>Estado:</strong> {selectedInvoice.status}</p>
              <p className="text-sm"><strong>Método de pago:</strong> {selectedInvoice.paymentMethod}</p>
              <p className="text-sm"><strong>Total:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p>
              <p className="text-sm"><strong>Creada:</strong> {formatDateTime(selectedInvoice.createdAt)}</p>
              <h4 className="font-semibold text-gray-900 mt-4 mb-2">Productos</h4>
              <ul className="list-disc list-inside space-y-1">
                {selectedInvoice.invoiceItems.map((item) => (
                  <li key={item.id} className="text-sm text-gray-700">
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

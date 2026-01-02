import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { useApi } from '../hooks/useApi';

const statusOptions: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { get, apiDelete } = useApi();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await get<Order[]>('/api/orders');
      return response;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiDelete(`/api/orders/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (selectedId === id) {
        setSelectedId(null);
    }
    },
  });

  const filteredOrders = useMemo(() => {
    if (!ordersQuery.data) return [];
    if (!status) return ordersQuery.data;
    return ordersQuery.data.filter((order) => order.status === status);
  }, [ordersQuery.data, status]);

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredOrders.some((order) => order.id === selectedId)) {
      setSelectedId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedId]);

  const selectedOrder = useMemo(() => {
    if (!filteredOrders.length) return null;
    return filteredOrders.find((order) => order.id === selectedId) ?? filteredOrders[0];
  }, [filteredOrders, selectedId]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Pedidos</h2>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Todos</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <DataTable
            data={filteredOrders}
            isLoading={ordersQuery.isFetching}
            emptyState="No hay pedidos registrados"
            columns={[
              { key: 'orderNumber', header: 'Pedido' },
              {
                key: 'createdAt',
                header: 'Creado',
                render: (order) => formatDateTime(order.createdAt)
              },
              {
                key: 'totalAmount',
                header: 'Total',
                render: (order) => formatCurrency(order.totalAmount)
              },
              { key: 'status', header: 'Estado' },
              {
                key: 'actions',
                header: 'Acciones',
                render: (order) => (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Eliminar pedido?')) {
                        deleteMutation.mutate(order.id);
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
        </section>
        <aside className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle</h3>
          {!selectedOrder && <p className="text-gray-600">Seleccione un pedido para ver el detalle.</p>}
          <ul className="list-none p-0 m-0 flex flex-col gap-2 mb-4">
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedOrder?.id === order.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-transparent border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {order.orderNumber} — {formatCurrency(order.totalAmount)}
                </button>
              </li>
            ))}
          </ul>
          {selectedOrder && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col gap-2 mb-4">
                <span className="text-sm"><strong>Estado:</strong> {selectedOrder.status}</span>
                <span className="text-sm"><strong>Subtotal:</strong> {formatCurrency(selectedOrder.subtotal)}</span>
                <span className="text-sm"><strong>Impuestos:</strong> {formatCurrency(selectedOrder.taxAmount)}</span>
                <span className="text-sm"><strong>Envío:</strong> {formatCurrency(selectedOrder.shippingAmount)}</span>
                <span className="text-sm"><strong>Total:</strong> {formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Productos</h4>
              <ul className="list-disc list-inside space-y-1">
                {selectedOrder.orderItems?.map((item) => (
                  <li key={item.id} className="text-sm text-gray-700">
                    {item.quantity}x {item.product.name} — {formatCurrency(item.totalPrice)}
                  </li>
                )) || <li className="text-sm text-gray-500">No hay detalles registrados</li>}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

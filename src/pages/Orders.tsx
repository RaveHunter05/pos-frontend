import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http';
import type { Order, OrderStatus } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import styles from './Orders.module.css';
import { formatCurrency, formatDateTime } from '@/lib/format';

const statusOptions: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await http.get<Order[]>('/api/orders');
      return response.data;
    }
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
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Pedidos</h2>
        <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | '')}>
          <option value="">Todos</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </header>
      <div className={styles.content}>
        <section className={styles.card}>
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
              { key: 'status', header: 'Estado' }
            ]}
          />
        </section>
        <aside className={styles.card}>
          <h3>Detalle</h3>
          {!selectedOrder && <p>Seleccione un pedido para ver el detalle.</p>}
          <ul className={styles.orderList}>
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <button type="button" onClick={() => setSelectedId(order.id)} className={selectedOrder?.id === order.id ? styles.active : ''}>
                  {order.orderNumber} — {formatCurrency(order.totalAmount)}
                </button>
              </li>
            ))}
          </ul>
          {selectedOrder && (
            <div className={styles.items}>
              <div className={styles.meta}>
                <span><strong>Estado:</strong> {selectedOrder.status}</span>
                <span><strong>Subtotal:</strong> {formatCurrency(selectedOrder.subtotal)}</span>
                <span><strong>Impuestos:</strong> {formatCurrency(selectedOrder.taxAmount)}</span>
                <span><strong>Envío:</strong> {formatCurrency(selectedOrder.shippingAmount)}</span>
                <span><strong>Total:</strong> {formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
              <h4>Productos</h4>
              <ul>
                {selectedOrder.orderItems?.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.product.name} — {formatCurrency(item.totalPrice)}
                  </li>
                )) || <li>No hay detalles registrados</li>}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

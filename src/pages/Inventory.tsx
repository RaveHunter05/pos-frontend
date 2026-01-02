import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';
import type { Inventory } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import styles from './Inventory.module.css';
import { buildFormBody } from '@/lib/forms';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ['inventories'],
    queryFn: async () => {
      const response = await http.get<Inventory[]>('/api/inventories');
      return response.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const body = buildFormBody({ quantity });
      await http.put(`/api/inventories/${id}`, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    }
  });

  const filteredInventory = useMemo(() => {
    if (!inventoryQuery.data) return [];
    if (!search.trim()) return inventoryQuery.data;
    const normalized = search.trim().toLowerCase();
    return inventoryQuery.data.filter((item) =>
      [item.product.name, item.product.sku, item.product.barCode]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    );
  }, [inventoryQuery.data, search]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Inventario</h2>
        <input
          type="search"
          placeholder="Buscar producto"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </header>
      <DataTable
        data={filteredInventory}
        isLoading={inventoryQuery.isFetching}
        emptyState="No hay inventario registrado"
        columns={[
          { key: 'product', header: 'Producto', render: (item) => item.product.name },
          { key: 'sku', header: 'SKU', render: (item) => item.product.sku },
          { key: 'quantity', header: 'Cantidad' },
          { key: 'minStock', header: 'Mínimo' },
          { key: 'maxStock', header: 'Máximo' },
          { key: 'location', header: 'Ubicación', render: (item) => item.location ?? '—' },
          {
            key: 'actions',
            header: 'Ajustar',
            render: (item) => (
              <div className={styles.tableActions}>
                <input
                  type="number"
                  className={styles.inputInline}
                  value={adjustments[item.id] ?? item.quantity}
                  onChange={(event) =>
                    setAdjustments((prev) => ({ ...prev, [item.id]: Number(event.target.value) }))
                  }
                />
                <button
                  type="button"
                  className={styles.button}
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({ id: item.id, quantity: adjustments[item.id] ?? item.quantity })
                  }
                >
                  Aplicar
                </button>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}

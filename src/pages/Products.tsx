import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http';
import type { Product } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import styles from './Products.module.css';
import { formatCurrency } from '@/lib/format';

export default function Products() {
  const [search, setSearch] = useState('');

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await http.get<Product[]>('/api/products');
      return response.data;
    }
  });

  const filteredProducts = useMemo(() => {
    if (!productsQuery.data) return [];
    if (!search.trim()) return productsQuery.data;
    const normalized = search.trim().toLowerCase();
    return productsQuery.data.filter((product) =>
      [product.name, product.brand, product.sku, product.barCode]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    );
  }, [productsQuery.data, search]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Productos</h2>
        <input
          type="search"
          placeholder="Buscar por nombre, SKU o código"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </header>
      <DataTable
        data={filteredProducts}
        isLoading={productsQuery.isFetching}
        emptyState="No se encontraron productos"
        columns={[
          { key: 'sku', header: 'SKU' },
          { key: 'name', header: 'Nombre' },
          { key: 'brand', header: 'Marca' },
          { key: 'barCode', header: 'Código de barras' },
          {
            key: 'costPrice',
            header: 'Costo',
            render: (product) => formatCurrency(product.costPrice ?? 0)
          },
          {
            key: 'taxPercentage',
            header: 'Impuesto',
            render: (product) => `${product.taxPercentage ?? 0}%`
          },
          {
            key: 'isActive',
            header: 'Estado',
            render: (product) => (product.isActive ? 'Activo' : 'Inactivo')
          },
          {
            key: 'productCategories',
            header: 'Categorías',
            render: (product) => product.productCategories?.map((category) => category.name).join(', ') || 'Sin categorías'
          }
        ]}
      />
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http';
import type { Product } from '@/types/domain';
import styles from './ProductSearch.module.css';
import { useCartStore } from '@/store/cart';
import { Toast } from '@/ui/Toast';
import { formatCurrency } from '@/lib/format';

export function ProductSearch() {
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const addProduct = useCartStore((state) => state.addProduct);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const productsQuery = useQuery({
    queryKey: ['products', 'search'],
    queryFn: async () => {
      const response = await http.get<Product[]>('/api/products');
      return response.data;
    },
    staleTime: 60_000
  });

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const normalized = search.trim().toLowerCase();
    return (
      productsQuery.data?.filter((product) => {
        return [product.name, product.sku, product.barCode]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalized));
      }) ?? []
    ).slice(0, 8);
  }, [productsQuery.data, search]);

  const handleSelect = (product: Product) => {
    addProduct(product);
    setToast(`Producto ${product.name} agregado`);
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor="product-search">
        Buscar producto (F2)
      </label>
      <input
        id="product-search"
        ref={inputRef}
        className={styles.input}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Nombre, SKU o código de barras"
      />
      {productsQuery.isFetching && <div className={styles.dropdown}>Cargando catálogo...</div>}
      {!!filteredProducts.length && search.length > 1 && (
        <div className={styles.dropdown}>
          {filteredProducts.map((product) => (
            <button key={product.id} type="button" className={styles.option} onClick={() => handleSelect(product)}>
              <span>
                <strong>{product.name}</strong>
                <small>{product.sku}</small>
              </span>
              <span>{formatCurrency(product.costPrice ?? 0)}</span>
            </button>
          ))}
        </div>
      )}
      {!productsQuery.isFetching && search.length > 2 && !filteredProducts.length && (
        <div className={styles.dropdown}>Sin resultados</div>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

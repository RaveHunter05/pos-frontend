import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product, Inventory } from '@/types/domain';
import { useCartStore } from '@/store/cart';
import { Toast } from '@/ui/Toast';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../hooks/useApi';
import { ProductModal } from './ProductModal';

export function ProductSearch() {
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; variant?: 'success' | 'error' | 'info' } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const addProduct = useCartStore((state) => state.addProduct);
  const inputRef = useRef<HTMLInputElement>(null);
  const { get } = useApi();

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
      const response = await get<Product[]>('/api/products');
      return response;
    },
    staleTime: 60_000
  });

  const inventoryQuery = useQuery({
    queryKey: ['inventories'],
    queryFn: async () => {
      const response = await get<Inventory[]>('/api/inventories');
      return response;
    },
    staleTime: 30_000
  });

  const getProductStock = (productId: number): number | null => {
    if (!inventoryQuery.data) return null;
    const inventory = inventoryQuery.data.find((inv) => inv.product.id === productId);
    return inventory?.quantity ?? 0;
  };

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

  const handleSelect = async (product: Product) => {
    const maxQuantity = getProductStock(product.id);

    if (maxQuantity === null) {
      setToast({ message: 'Inventario cargando, intenta en un momento', variant: 'info' });
      return;
    }

    if (maxQuantity <= 0) {
      setToast({ message: 'No hay stock disponible para este producto', variant: 'error' });
      return;
    }

    const result = addProduct(product, maxQuantity);

    if (result.success) {
      setToast({ message: `Producto ${product.name} agregado`, variant: 'success' });
      setSearch('');
      inputRef.current?.focus();
    } else {
      setToast({ message: result.message || 'Error al agregar producto', variant: 'error' });
    }
  };

  const handleCreateProduct = () => {
    setCreateModalOpen(true);
  };

  const handleProductCreated = () => {
    setCreateModalOpen(false);
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="product-search">
        Buscar producto (F2)
      </label>
      <input
        id="product-search"
        ref={inputRef}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Nombre, SKU o código de barras"
      />
      {productsQuery.isFetching && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-gray-600">
          Cargando catálogo...
        </div>
      )}
      {!!filteredProducts.length && search.length > 1 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex justify-between items-center"
              onClick={() => handleSelect(product)}
            >
              <span>
                <strong className="block text-gray-900">{product.name}</strong>
                <small className="text-xs text-gray-500">{product.sku}</small>
              </span>
              <span className="font-semibold text-gray-900">{formatCurrency(product.costPrice ?? 0)}</span>
            </button>
          ))}
        </div>
      )}
      {!productsQuery.isFetching && search.length > 2 && !filteredProducts.length && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-gray-600 mb-3">No se encontraron productos</div>
          <button
            type="button"
            onClick={handleCreateProduct}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Crear producto
          </button>
        </div>
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
      <ProductModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleProductCreated}
        initialBarCode={search.length > 2 && !filteredProducts.length ? search : undefined}
      />
    </div>
  );
}

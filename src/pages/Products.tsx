import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product, Category } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../hooks/useApi';
import { ProductModal } from '@/components/ProductModal';

export default function Products() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { get, apiDelete } = useApi();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await get<Product[]>('/api/products');
      return response;
    },
  });


  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiDelete(`/api/products/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (editing?.id === id) {
        setEditing(null);
        setModalOpen(false);
      }
    },
  });

  const handleCreateClick = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditing(product);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditing(null);
  };

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Productos</h2>
        <button
          type="button"
          onClick={handleCreateClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Crear producto
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="mb-4">
            <input
              type="search"
              placeholder="Buscar por nombre, SKU o código"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
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
                render: (product) => formatCurrency(product.costPrice ?? 0),
              },
              {
                key: 'taxPercentage',
                header: 'Impuesto',
                render: (product) => `${product.taxPercentage ?? 0}%`,
              },
              {
                key: 'isActive',
                header: 'Estado',
                render: (product) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                ),
              },
              {
                key: 'productCategories',
                header: 'Categorías',
                render: (product) =>
                  product.productCategories?.map((category) => category.name).join(', ') || 'Sin categorías',
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (product) => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(product)}
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('¿Eliminar producto?')) {
                          deleteMutation.mutate(product.id);
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </section>
      </div>
      <ProductModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editing={editing}
      />
    </div>
  );
}

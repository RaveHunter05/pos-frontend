import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product, Category } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { formatCurrency } from '@/lib/format';
import { buildFormBody } from '@/lib/forms';
import { useApi } from '../hooks/useApi';

const productSchema = z.object({
  sku: z.string().min(1, 'El SKU es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  brand: z.string().optional(),
  description: z.string().optional(),
  barCode: z.string().optional(),
  measureUnit: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Products() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);

  const { get, post, put, apiDelete } = useApi();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      taxPercentage: 0,
    },
  });

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await get<Product[]>('/api/products');
      return response;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await get<Category[]>('/api/categories');
      return response;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const body = buildFormBody(values);
      if (editing) {
        const response = await put(`/api/products/${editing.id}`, body);
        return response;
      }
      const response = await post('/api/products', body);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      reset();
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiDelete(`/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (editing?.id === id) {
        setEditing(null);
        reset();
      }
    },
  });

  const onSubmit = (values: ProductFormValues) => {
    upsertMutation.mutate(values);
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
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
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
                      onClick={() => {
                        setEditing(product);
                        reset({
                          sku: product.sku,
                          name: product.name,
                          brand: product.brand,
                          description: product.description,
                          barCode: product.barCode,
                          measureUnit: product.measureUnit,
                          costPrice: product.costPrice,
                          taxPercentage: product.taxPercentage ?? 0,
                          isActive: product.isActive,
                        });
                      }}
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
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Editar producto' : 'Crear producto'}
          </h3>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input
                type="text"
                {...register('sku')}
                placeholder="Ej. PROD-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.sku && <span className="text-sm text-red-600 mt-1 block">{errors.sku.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Ej. Producto ejemplo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.name && <span className="text-sm text-red-600 mt-1 block">{errors.name.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                {...register('brand')}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                rows={3}
                {...register('description')}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
              <input
                type="text"
                {...register('barCode')}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
              <input
                type="text"
                {...register('measureUnit')}
                placeholder="Ej. kg, litros, unidades"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de costo *</label>
              <input
                type="number"
                step="0.01"
                {...register('costPrice')}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.costPrice && <span className="text-sm text-red-600 mt-1 block">{errors.costPrice.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de impuesto (%)</label>
              <input
                type="number"
                step="0.01"
                {...register('taxPercentage')}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Producto activo</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={upsertMutation.isPending}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editing ? 'Actualizar' : 'Crear'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  reset({
                    sku: '',
                    name: '',
                    brand: '',
                    description: '',
                    barCode: '',
                    measureUnit: '',
                    costPrice: 0,
                    taxPercentage: 0,
                    isActive: true,
                  });
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar edición
              </button>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Product, Category } from '@/types/domain';
import { Toast } from '@/ui/Toast';
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

type ProductModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editing?: Product | null;
  initialBarCode?: string;
};

export function ProductModal({ open, onClose, onSuccess, editing, initialBarCode }: ProductModalProps) {
  const queryClient = useQueryClient();
  const { get, post, put } = useApi();

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
      barCode: initialBarCode || '',
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await get('/api/categories') as Category[];
      return response;
    },
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (open) {
      window.addEventListener('keydown', handler);
    }
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          sku: editing.sku,
          name: editing.name,
          brand: editing.brand,
          description: editing.description,
          barCode: editing.barCode,
          measureUnit: editing.measureUnit,
          costPrice: editing.costPrice,
          taxPercentage: editing.taxPercentage ?? 0,
          isActive: editing.isActive,
        });
      } else {
        reset({
          sku: '',
          name: '',
          brand: '',
          description: '',
          barCode: initialBarCode || '',
          measureUnit: '',
          costPrice: 0,
          taxPercentage: 0,
          isActive: true,
        });
      }
    }
  }, [open, editing, initialBarCode, reset]);

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
      queryClient.invalidateQueries({ queryKey: ['products', 'search'] });
      reset();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
  });

  const onSubmit = (values: ProductFormValues) => {
    upsertMutation.mutate(values);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {editing ? 'Editar producto' : 'Crear producto'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </header>
        <form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <footer className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={upsertMutation.isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editing ? 'Actualizar' : 'Crear producto'}
            </button>
          </footer>
        </form>
        {upsertMutation.isError && (
          <Toast
            message="Error al guardar el producto. Intente nuevamente."
            variant="error"
            onClose={() => upsertMutation.reset()}
          />
        )}
        {upsertMutation.isSuccess && (
          <Toast
            message={editing ? 'Producto actualizado correctamente' : 'Producto creado correctamente'}
            variant="success"
            onClose={() => upsertMutation.reset()}
          />
        )}
      </div>
    </div>
  );
}


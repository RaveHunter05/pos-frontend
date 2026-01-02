import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCartStore } from '@/store/cart';
import { Toast } from '@/ui/Toast';
import { useState } from 'react';

const settingsSchema = z.object({
  taxRate: z
    .number({ invalid_type_error: 'Ingrese un porcentaje válido' })
    .min(0, 'Debe ser positivo')
    .max(100, 'Máximo 100%'),
  currency: z.string().min(1)
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const taxRate = useCartStore((state) => state.taxRate);
  const setTaxRate = useCartStore((state) => state.setTaxRate);
  const [toast, setToast] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      taxRate: taxRate * 100,
      currency: 'C$'
    }
  });

  const onSubmit = (values: SettingsValues) => {
    setTaxRate(values.taxRate / 100);
    setToast('Configuración guardada');
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-gray-900">Configuración</h2>
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IVA (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('taxRate', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.taxRate && <span className="text-sm text-red-600 mt-1 block">{errors.taxRate.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
            <input
              type="text"
              {...register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Guardar
          </button>
      </form>
      </div>
      {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}
    </div>
  );
}

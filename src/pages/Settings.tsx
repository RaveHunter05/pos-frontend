import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './Settings.module.css';
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
    <div className={styles.wrapper}>
      <h2>Configuración</h2>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <label>
          IVA (%)
          <input type="number" step="0.01" {...register('taxRate', { valueAsNumber: true })} />
          {errors.taxRate && <span className={styles.error}>{errors.taxRate.message}</span>}
        </label>
        <label>
          Moneda
          <input type="text" {...register('currency')} />
        </label>
        <button type="submit">Guardar</button>
      </form>
      {toast && <Toast message={toast} variant="success" onClose={() => setToast(null)} />}
    </div>
  );
}

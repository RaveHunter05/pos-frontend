import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { http } from '@/lib/http';
import type { Invoice } from '@/types/domain';
import { useCartStore, calculateCartTotals } from '@/store/cart';
import styles from './PaymentModal.module.css';
import { Toast } from '@/ui/Toast';
import { formatCurrency } from '@/lib/format';

const paymentMethods = ['CASH', 'CARD', 'TRANSFER', 'CHECK'] as const;

const paymentSchema = z.object({
  customerName: z.string().optional(),
  paymentMethod: z.enum(paymentMethods),
  notes: z.string().optional()
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type PaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
};

export function PaymentModal({ open, onClose, onSuccess }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const { items, taxRate, discount } = useCartStore((state) => ({
    items: state.items,
    taxRate: state.taxRate,
    discount: state.discount
  }));
  const clear = useCartStore((state) => state.clear);
  const totals = calculateCartTotals({ items, taxRate, discount });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: 'CASH'
    }
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

  const mutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const taxableBase = totals.subtotal > 0 ? totals.subtotal : 1;
      const payload = {
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: new Date().toISOString().slice(0, 10),
        subtotal: totals.subtotal,
        taxAmount: totals.tax,
        totalAmount: totals.total,
        taxRate: Number(((totals.tax / taxableBase) * 100).toFixed(2)),
        status: 'PAID',
        paymentMethod: values.paymentMethod,
        notes: values.notes,
        invoiceItems: items.map((item) => ({
          description: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.costPrice ?? 0,
          totalPrice: (item.product.costPrice ?? 0) * item.quantity,
          product: { id: item.product.id }
        }))
      };
      const response = await http.post<Invoice>('/api/invoices', payload);
      return response.data;
    },
    onSuccess: (invoice) => {
      clear();
      reset();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onSuccess(invoice);
    }
  });

  const onSubmit = (values: PaymentFormValues) => {
    if (!items.length) return;
    mutation.mutate(values);
  };

  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <h3>Confirmar pago</h3>
          <button type="button" onClick={onClose} className={styles.close}>
            ×
          </button>
        </header>
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.field}>
            <label>Cliente</label>
            <input type="text" placeholder="Opcional" {...register('customerName')} />
          </div>
          <div className={styles.field}>
            <label>Método de pago</label>
            <select {...register('paymentMethod')}>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.paymentMethod && <span className={styles.error}>{errors.paymentMethod.message}</span>}
          </div>
          <div className={styles.field}>
            <label>Notas</label>
            <textarea rows={3} {...register('notes')} placeholder="Observaciones opcionales" />
          </div>
          <section className={styles.summary}>
            <div>
              <span>Total a cobrar</span>
              <strong>{formatCurrency(totals.total)}</strong>
            </div>
          </section>
          <footer className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.secondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.primary} disabled={mutation.isPending || !items.length}>
              Confirmar y emitir factura
            </button>
          </footer>
        </form>
      </div>
      {mutation.isError && (
        <Toast
          message="Error al emitir la factura. Intente nuevamente."
          variant="error"
          onClose={() => mutation.reset()}
        />
      )}
      {mutation.isSuccess && (
        <Toast
          message="Factura emitida correctamente"
          variant="success"
          onClose={() => mutation.reset()}
        />
      )}
    </div>
  );
}

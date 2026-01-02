import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Invoice } from '@/types/domain';
import { useCartStore, calculateCartTotals } from '@/store/cart';
import { Toast } from '@/ui/Toast';
import { formatCurrency } from '@/lib/format';
import { useApi } from '../hooks/useApi';

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
  const { post } = useApi();
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
      const response = await post<Invoice>('/api/invoices', payload);
      return response;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4" role="dialog" aria-modal="true">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirmar pago</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </header>
        <form className="p-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              type="text"
              placeholder="Opcional"
              {...register('customerName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
            <select
              {...register('paymentMethod')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <span className="text-sm text-red-600 mt-1 block">{errors.paymentMethod.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              rows={3}
              {...register('notes')}
              placeholder="Observaciones opcionales"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <section className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total a cobrar</span>
              <strong className="text-xl font-bold text-indigo-600">{formatCurrency(totals.total)}</strong>
            </div>
          </section>
          <footer className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !items.length}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
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

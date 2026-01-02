const currencyFormatter = new Intl.NumberFormat('es-NI', {
  style: 'currency',
  currency: 'NIO'
});

export const formatCurrency = (value: number | undefined | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(value);
};

export const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-NI');
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-NI');
};
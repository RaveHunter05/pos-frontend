import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Customer } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import { useApi } from '../hooks/useApi';

interface CustomerPage {
  content: Customer[];
  totalPages: number;
  page: number;
  totalElements: number;
}

export default function Customers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const { get } = useApi();

  const { data, isFetching } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const response = await get<CustomerPage>('/api/customers');
      return response;
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Clientes</h2>
        <input
          type="search"
          placeholder="Buscar cliente"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </header>
      <DataTable
        data={data?.content ?? []}
        isLoading={isFetching}
        emptyState="No hay clientes registrados"
        columns={[
          { key: 'name', header: 'Nombre' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Teléfono' },
          { key: 'identification', header: 'Identificación' }
        ]}
      />
      <footer className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          disabled={page === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        <span className="text-gray-600">
          Página {page + 1} de {data?.totalPages ?? 1}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => (data && prev + 1 < data.totalPages ? prev + 1 : prev))}
          disabled={data ? page + 1 >= data.totalPages : true}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </footer>
    </div>
  );
}

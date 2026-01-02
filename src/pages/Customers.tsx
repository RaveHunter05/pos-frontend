import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http';
import type { Customer } from '@/types/domain';
import { DataTable } from '@/components/DataTable';
import styles from './Customers.module.css';

interface CustomerPage {
  content: Customer[];
  totalPages: number;
  page: number;
  totalElements: number;
}

export default function Customers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const response = await http.get<CustomerPage>('/api/customers', {
        params: { page, search, size: 10 }
      });
      return response.data;
    }
  });

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Clientes</h2>
        <input
          type="search"
          placeholder="Buscar cliente"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
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
      <footer className={styles.pagination}>
        <button type="button" onClick={() => setPage((prev) => Math.max(prev - 1, 0))} disabled={page === 0}>
          Anterior
        </button>
        <span>
          Página {page + 1} de {data?.totalPages ?? 1}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => (data && prev + 1 < data.totalPages ? prev + 1 : prev))}
          disabled={data ? page + 1 >= data.totalPages : true}
        >
          Siguiente
        </button>
      </footer>
    </div>
  );
}

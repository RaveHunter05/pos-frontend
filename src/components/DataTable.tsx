import React from 'react';
import styles from './DataTable.module.css';

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
};

export function DataTable<T extends Record<string, any>>({ data, columns, isLoading, emptyState }: DataTableProps<T>) {
  if (isLoading) {
    return <div className={styles.skeleton}>Cargando...</div>;
  }

  if (!data.length) {
    return <div className={styles.empty}>{emptyState ?? 'No hay datos disponibles.'}</div>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key as string}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key as string}>{column.render ? column.render(item) : String(item[column.key as keyof T])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

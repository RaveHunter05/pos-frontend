import React from 'react';

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
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        Cargando...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        {emptyState ?? 'No hay datos disponibles.'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
          <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className="px-4 py-3 text-sm text-gray-900"
                  >
                    {column.render ? column.render(item) : String(item[column.key as keyof T])}
                  </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

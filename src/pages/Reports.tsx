import { useState } from 'react';
import dayjs from 'dayjs';
import { SalesByDayChart } from '@/components/Charts/SalesByDay';
import { TopProductsChart } from '@/components/Charts/TopProducts';
import { RevenueByCategoryChart } from '@/components/Charts/RevenueByCategory';

export default function Reports() {
  const [range] = useState({
    from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Reportes</h2>
        <p className="text-gray-600">
          Rango: {dayjs(range.from).format('DD/MM/YYYY')} - {dayjs(range.to).format('DD/MM/YYYY')}
        </p>
      </header>
      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <SalesByDayChart from={range.from} to={range.to} title="Ventas por día" />
        <TopProductsChart from={range.from} to={range.to} title="Top productos" />
        <RevenueByCategoryChart from={range.from} to={range.to} title="Ingresos por categoría" />
      </section>
    </div>
  );
}

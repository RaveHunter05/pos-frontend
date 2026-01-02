import { useState } from 'react';
import dayjs from 'dayjs';
import styles from './Reports.module.css';
import { SalesByDayChart } from '@/components/Charts/SalesByDay';
import { TopProductsChart } from '@/components/Charts/TopProducts';
import { RevenueByCategoryChart } from '@/components/Charts/RevenueByCategory';

export default function Reports() {
  const [range] = useState({
    from: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD')
  });

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Reportes</h2>
        <p>
          Rango: {dayjs(range.from).format('DD/MM/YYYY')} - {dayjs(range.to).format('DD/MM/YYYY')}
        </p>
      </header>
      <section className={styles.charts}>
        <SalesByDayChart from={range.from} to={range.to} title="Ventas por día" />
        <TopProductsChart from={range.from} to={range.to} title="Top productos" />
        <RevenueByCategoryChart from={range.from} to={range.to} title="Ingresos por categoría" />
      </section>
    </div>
  );
}

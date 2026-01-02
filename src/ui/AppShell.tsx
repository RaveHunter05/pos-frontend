import { Navigate, NavLink, Outlet } from 'react-router-dom';
import styles from './AppShell.module.css';
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';

const navigation = [
	{ to: '/user/dashboard', label: 'Dashboard' },
	{ to: '/user/pos', label: 'POS' },
	{ to: '/user/products', label: 'Productos' },
	{ to: '/user/categories', label: 'Categorías' },
	{ to: '/user/inventory', label: 'Inventario' },
	{ to: '/user/orders', label: 'Pedidos' },
	{ to: '/user/customers', label: 'Clientes' },
	{ to: '/user/invoices', label: 'Facturas' },
	{ to: '/user/reports', label: 'Reportes' },
	{ to: '/user/settings', label: 'Configuración' },
];

export function AppShell() {
	const { isSignedIn, user, isLoaded } = useUser();

	if (!isLoaded) {
		return <div>Loading...</div>;
	}

	if (!isSignedIn) {
		return <Navigate to="/" replace />;
	}
	return (
		<div className={styles.layout}>
			<aside className={styles.sidebar}>
				<div className={styles.brand}>POS PyME</div>
				<nav className={styles.nav}>
					{navigation.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								isActive ? `${styles.link} ${styles.active}` : styles.link
							}
						>
							{item.label}
						</NavLink>
					))}

					<SignedIn>
						<div className="fixed right-5 top-3">
							<UserButton />
						</div>
					</SignedIn>
				</nav>
			</aside>
			<main className={styles.main}>
				<header className={styles.header}>
					<h1>Panel POS</h1>
				</header>
				<section className={styles.content}>
					<Outlet />
				</section>
			</main>
		</div>
	);
}

import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';

const navigation = [
	{ to: '/user/dashboard', label: 'Dashboard' },
	{ to: '/user/assign-store', label: 'Assign Store' },
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
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-gray-600">Cargando...</div>
			</div>
		);
	}

	if (!isSignedIn) {
		return <Navigate to="/" replace />;
	}
	return (
		<div className="grid grid-cols-[260px_1fr] min-h-screen">
			<aside className="bg-gray-900 text-gray-100 p-6 flex flex-col gap-6">
				<div className="text-xl font-bold">POS PyME</div>
				<nav className="flex flex-col gap-2">
					{navigation.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								`px-4 py-3 rounded-lg transition-colors ${
									isActive
										? 'bg-indigo-600 text-white'
										: 'text-gray-300 hover:bg-white/10'
								}`
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
			<main className="flex flex-col bg-gray-50">
				<header className="px-8 py-6 border-b border-gray-200 bg-white">
					<h1 className="text-2xl font-semibold text-gray-900">Panel POS</h1>
				</header>
				<section className="p-8">
					<Outlet />
				</section>
			</main>
		</div>
	);
}

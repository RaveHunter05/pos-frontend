import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/ui/AppShell';
import Dashboard from '@/pages/Dashboard';
import Pos from '@/pages/Pos';
import Products from '@/pages/Products';
import Customers from '@/pages/Customers';
import Invoices from '@/pages/Invoices';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Categories from '@/pages/Categories';
import Inventory from '@/pages/Inventory';
import Orders from '@/pages/Orders';
import HomePage from '@/pages/HomePage';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <HomePage />,
	},
	{
		path: '/user',
		element: <AppShell />,
		children: [
			{ index: true, element: <Navigate to="/" replace /> },
			{ path: 'dashboard', element: <Dashboard /> },
			{ path: 'pos', element: <Pos /> },
			{ path: 'products', element: <Products /> },
			{ path: 'categories', element: <Categories /> },
			{ path: 'inventory', element: <Inventory /> },
			{ path: 'orders', element: <Orders /> },
			{ path: 'customers', element: <Customers /> },
			{ path: 'invoices', element: <Invoices /> },
			{ path: 'reports', element: <Reports /> },
			{ path: 'settings', element: <Settings /> },
		],
	},
]);

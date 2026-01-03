import {
	SignedOut,
	SignInButton,
	SignUpButton,
	useUser,
	SignedIn,
} from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
	const { isSignedIn } = useUser();
	const navigate = useNavigate();

	const currentYear = new Date().getFullYear();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			{/* Navigation */}
			<nav className="w-full px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-sm shadow-sm">
				<div className="text-2xl font-bold text-indigo-600">POS System</div>
				<SignedOut>
					<div className="flex gap-4">
						<SignInButton forceRedirectUrl={'/user/dashboard'}>
							<button className="px-6 py-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
								Iniciar sesión
							</button>
						</SignInButton>
						<SignUpButton>
							<button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
								Registrar
							</button>
						</SignUpButton>
					</div>
				</SignedOut>
				<SignedIn>
					<button
						onClick={() => navigate('/user/dashboard')}
						className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
					>
						Ir al Dashboard
					</button>
				</SignedIn>
			</nav>

			{/* Hero Section */}
			<main className="container mx-auto px-6 py-20">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
						Sistema de Punto de Venta
					</h1>
					<p className="text-xl text-gray-600 mb-8 leading-relaxed">
						Gestiona tu inventario, productos, pedidos y facturas de manera
						eficiente. Una solución completa para tu negocio.
					</p>

					<SignedOut>
						<div className="flex gap-4 justify-center mb-16">
							<SignInButton forceRedirectUrl={'/user/dashboard'}>
								<button className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl">
									Iniciar sesión
								</button>
							</SignInButton>
							<SignUpButton>
								<button className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-colors">
									Crear cuenta
								</button>
							</SignUpButton>
						</div>
					</SignedOut>

					<SignedIn>
						<div className="flex gap-4 justify-center mb-16">
							<button
								onClick={() => navigate('/user/dashboard')}
								className="px-8 py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
							>
								Ir al Dashboard
							</button>
						</div>
					</SignedIn>

					{/* Features Grid */}
					<div className="grid md:grid-cols-3 gap-8 mt-20">
						<div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
							<div className="text-4xl mb-4">📦</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Gestión de Inventario
							</h3>
							<p className="text-gray-600">
								Controla tu stock, ajusta cantidades y monitorea tus productos
								en tiempo real.
							</p>
						</div>
						<div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
							<div className="text-4xl mb-4">🛒</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Punto de Venta
							</h3>
							<p className="text-gray-600">
								Procesa ventas rápidamente con nuestro sistema POS integrado.
							</p>
						</div>
						<div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
							<div className="text-4xl mb-4">📊</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Reportes y Análisis
							</h3>
							<p className="text-gray-600">
								Obtén insights valiosos sobre tus ventas y rendimiento del
								negocio.
							</p>
						</div>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-8 mt-20">
				<div className="container mx-auto px-6 text-center text-gray-600">
					<p>&copy; {currentYear} POS System. Todos los derechos reservados.</p>
				</div>
			</footer>
		</div>
	);
};

export default HomePage;

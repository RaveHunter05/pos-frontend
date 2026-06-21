import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/app/router';
import { queryClient } from '@/app/queryClient';
import '@/index.css';
import { ClerkProvider } from '@clerk/clerk-react';

import { Toaster } from 'react-hot-toast';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ClerkProvider publishableKey={PUBLISHABLE_KEY}>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />

				{/* ← Aquí se pone el Toaster */}
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: '#333',
							color: '#fff',
						},
					}}
				/>
			</QueryClientProvider>
		</ClerkProvider>
	</React.StrictMode>,
);

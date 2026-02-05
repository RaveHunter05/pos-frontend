import { Button } from '@/components/ui/button';
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	useComboboxAnchor,
} from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import useStores from '@/hooks/useStores';
import useUsers from '@/hooks/useUsers';
import { useEffect, useState } from 'react';

const AssignStore = () => {
	const {
		users,
		loading,
		error,
		selectedUser,
		setSelectedUser,
		fetchUsers,
		isAdmin,
	} = useUsers();

	const {
		stores,
		loading: loadingStores,
		error: errorStores,
		selectedStore,
		fetchStores,
		setSelectedStore,
	} = useStores();

	const [page, setPage] = useState(1);

	// Si no se utiliza anchor no funciona bien el componente de Combobox de Shadcn
	const anchor = useComboboxAnchor();

	// Si no se utiliza anchor no funciona bien el componente de Combobox de Shadcn
	const storeAnchor = useComboboxAnchor();

	useEffect(() => {
		fetchUsers(page);
	}, [page, fetchUsers]);

	useEffect(() => {
		fetchStores();
	}, [fetchStores]);

	if (loadingStores) {
		return <div>Cargando tiendas...</div>;
	}

	if (errorStores) {
		return <div className="alert alert-danger">Error: {errorStores}</div>;
	}

	if (loading) return <Skeleton />;

	if (error) return <p> Error with retorning users </p>;

	return (
		<div className="flex flex-col space-y-4 w-1/2">
			<p className="text-orange-500">
				⚠️⚠️⚠️ (Only Admins Should Be Allowed) ⚠️⚠️⚠️
			</p>

			{JSON.stringify(selectedUser, null, 2)}
			<section>
				<h2> Seleccione un usuario </h2>
				<div ref={anchor} className="w-full">
					<Combobox
						items={users}
						value={selectedUser}
						onValueChange={setSelectedUser}
					>
						<ComboboxInput
							placeholder="Select a framework"
							value={selectedUser?.firstName}
							readOnly
						/>

						<ComboboxContent anchor={anchor}>
							<ComboboxList>
								{(item) => (
									<ComboboxItem key={item.clerkId} value={item}>
										{item.firstName}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</div>
			</section>

			<section className="mt-8">
				<h2> Seleccione un negocio </h2>

				<div ref={storeAnchor} className="w-full">
					<Combobox
						items={stores}
						value={selectedStore}
						onValueChange={setSelectedStore}
					>
						<ComboboxInput
							placeholder="Select a framework"
							value={selectedStore?.name}
							readOnly
						/>

						<ComboboxContent anchor={storeAnchor}>
							<ComboboxList>
								{(item) => (
									<ComboboxItem key={item.id} value={item}>
										{item.name}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</div>
			</section>

			<Button className="bg-indigo-600 hover:bg-white hover:text-indigo-600 hover:border hover:border-2 hover:cursor-pointer hover:border-indigo-600">
				Asignar Rol
			</Button>
		</div>
	);
};

export default AssignStore;

import { ExampleCombobox } from '@/components/ExampleCombobox';
import { Button } from '@/components/ui/button';
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@/components/ui/combobox';

type Framework = {
	label: string;
	value: string;
};

const AssignStore = () => {
	return (
		<div className="flex flex-col space-y-4 w-1/2">
			<p className="text-orange-500">
				⚠️⚠️⚠️ (Only Admins Should Be Allowed) ⚠️⚠️⚠️
			</p>
			<section>
				<h2> Seleccione un usuario </h2>
				<ExampleCombobox />
			</section>

			<section className="mt-8">
				<h2> Seleccione un negocio </h2>

				<ExampleCombobox />
			</section>

			<Button className="bg-indigo-600 hover:bg-white hover:text-indigo-600 hover:border hover:border-2 hover:cursor-pointer hover:border-indigo-600">
				Asignar Rol
			</Button>
		</div>
	);
};

export default AssignStore;

import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from '@headlessui/react';
import { useState } from 'react';

const people = [
	{ id: 1, name: 'Durward Reynolds' },
	{ id: 2, name: 'Kenton Towne' },
	{ id: 3, name: 'Therese Wunsch' },
	{ id: 4, name: 'Benedict Kessler' },
	{ id: 5, name: 'Katelyn Rohan' },
];

const AssignStore = () => {
	const [selectedPerson, setSelectedPerson] = useState(people[0]);
	const [query, setQuery] = useState('');

	const filteredPeople =
		query === ''
			? people
			: people.filter((person) => {
				return person.name.toLowerCase().includes(query.toLowerCase());
			});
	return (
		<div className="w-1/2">
			<section>
				<h2> Seleccione un usuario </h2>
			</section>

			<section className="mt-8">
				<h2> Seleccione un negocio </h2>
			</section>
		</div>
	);
};

export default AssignStore;

import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	useComboboxAnchor,
} from '@/components/ui/combobox';
import { useState } from 'react';

const frameworks = ['Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro'];

export function ExampleCombobox() {
	const anchor = useComboboxAnchor();
	const [value, setValue] = useState<string | null>(null);
	return (
		<div ref={anchor} className="w-full">
			<Combobox items={frameworks} value={value} onValueChange={setValue}>
				<ComboboxInput
					placeholder="Select a framework"
					value={value}
					readOnly
				/>

				<ComboboxContent anchor={anchor}>
					<ComboboxList>
						{(item) => (
							<ComboboxItem key={item} value={item}>
								{item}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</div>
	);
}

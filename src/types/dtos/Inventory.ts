export interface GetInventories {
	id: string;
	quantity: number;
	sku: string;
	brand: string;
	name: string;
	description: string;
	location: string;
	barCode: string;
	measureUnit: string;
	isActive: boolean;
	sellPrice: number;
}

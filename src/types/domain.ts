export type Category = {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  identification?: string;
};

export type Product = {
  id: number;
  sku: string;
  brand?: string;
  name: string;
  description?: string;
  barCode?: string;
  measureUnit?: string;
  costPrice: number;
  isActive: boolean;
  taxPercentage?: number;
  productCategories?: Category[];
};

export type Inventory = {
  id: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  lastRestockDate?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  product: Product;
};

export type OrderItem = {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: Product;
};

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type Order = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  orderItems?: OrderItem[];
};

export type InvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
};

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK';

export type Invoice = {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  createdAt?: string;
  invoiceItems: InvoiceItem[];
  order?: Order;
};

export type CartItem = {
  product: Product;
  quantity: number;
  discount?: number;
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  role: 'admin' | 'user' | 'manager';
  store?: {
    id: string;
    name: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  userIds: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  message?: string;
}

// Mock data for the POS system

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  variants: ProductVariant[];
  image: string;
  sku: string;
  description: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  preferences: {
    size: string;
    style: string[];
  };
}

export interface Sale {
  id: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashierId: string;
  timestamp: string;
  status: 'completed' | 'refunded' | 'partial-refund';
}

export interface SaleItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cashier' | 'manager' | 'owner';
  permissions: string[];
}

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Elegant Summer Dress',
    category: 'Dresses',
    price: 89.99,
    cost: 35.00,
    stock: 15,
    image: '/api/placeholder/300/400',
    sku: 'DRESS-001',
    description: 'Flowy summer dress perfect for any occasion',
    variants: [
      { id: '1a', size: 'XS', color: 'Navy', stock: 3, sku: 'DRESS-001-XS-NAV' },
      { id: '1b', size: 'S', color: 'Navy', stock: 5, sku: 'DRESS-001-S-NAV' },
      { id: '1c', size: 'M', color: 'Navy', stock: 4, sku: 'DRESS-001-M-NAV' },
      { id: '1d', size: 'S', color: 'Coral', stock: 3, sku: 'DRESS-001-S-COR' },
    ]
  },
  {
    id: '2',
    name: 'Classic White Blouse',
    category: 'Tops',
    price: 65.00,
    cost: 25.00,
    stock: 22,
    image: '/api/placeholder/300/400',
    sku: 'BLOUSE-001',
    description: 'Versatile white blouse for professional and casual wear',
    variants: [
      { id: '2a', size: 'XS', color: 'White', stock: 4, sku: 'BLOUSE-001-XS-WHT' },
      { id: '2b', size: 'S', color: 'White', stock: 6, sku: 'BLOUSE-001-S-WHT' },
      { id: '2c', size: 'M', color: 'White', stock: 8, sku: 'BLOUSE-001-M-WHT' },
      { id: '2d', size: 'L', color: 'White', stock: 4, sku: 'BLOUSE-001-L-WHT' },
    ]
  },
  {
    id: '3',
    name: 'Designer Handbag',
    category: 'Accessories',
    price: 195.00,
    cost: 78.00,
    stock: 8,
    image: '/api/placeholder/300/400',
    sku: 'BAG-001',
    description: 'Luxury leather handbag with gold hardware',
    variants: [
      { id: '3a', size: 'One Size', color: 'Black', stock: 3, sku: 'BAG-001-OS-BLK' },
      { id: '3b', size: 'One Size', color: 'Brown', stock: 3, sku: 'BAG-001-OS-BRN' },
      { id: '3c', size: 'One Size', color: 'Tan', stock: 2, sku: 'BAG-001-OS-TAN' },
    ]
  },
  {
    id: '4',
    name: 'Skinny Jeans',
    category: 'Bottoms',
    price: 79.99,
    cost: 32.00,
    stock: 18,
    image: '/api/placeholder/300/400',
    sku: 'JEANS-001',
    description: 'Perfect fit skinny jeans in stretch denim',
    variants: [
      { id: '4a', size: '26', color: 'Dark Wash', stock: 3, sku: 'JEANS-001-26-DRK' },
      { id: '4b', size: '28', color: 'Dark Wash', stock: 5, sku: 'JEANS-001-28-DRK' },
      { id: '4c', size: '30', color: 'Dark Wash', stock: 4, sku: 'JEANS-001-30-DRK' },
      { id: '4d', size: '28', color: 'Light Wash', stock: 3, sku: 'JEANS-001-28-LGT' },
      { id: '4e', size: '30', color: 'Light Wash', stock: 3, sku: 'JEANS-001-30-LGT' },
    ]
  }
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '(555) 123-4567',
    loyaltyPoints: 450,
    totalSpent: 1250.00,
    visits: 8,
    lastVisit: '2024-01-15',
    preferences: {
      size: 'M',
      style: ['casual', 'professional']
    }
  },
  {
    id: '2',
    name: 'Emily Davis',
    email: 'emily@email.com',
    phone: '(555) 987-6543',
    loyaltyPoints: 230,
    totalSpent: 680.00,
    visits: 5,
    lastVisit: '2024-01-12',
    preferences: {
      size: 'S',
      style: ['trendy', 'casual']
    }
  },
  {
    id: '3',
    name: 'Jennifer Wilson',
    email: 'jen@email.com',
    phone: '(555) 456-7890',
    loyaltyPoints: 890,
    totalSpent: 2340.00,
    visits: 15,
    lastVisit: '2024-01-14',
    preferences: {
      size: 'L',
      style: ['elegant', 'formal']
    }
  }
];

// Mock Sales
export const mockSales: Sale[] = [
  {
    id: '1',
    customerId: '1',
    items: [
      { productId: '1', variantId: '1b', quantity: 1, price: 89.99 },
      { productId: '3', variantId: '3a', quantity: 1, price: 195.00 }
    ],
    subtotal: 284.99,
    tax: 22.80,
    total: 307.79,
    paymentMethod: 'credit_card',
    cashierId: '1',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: '2',
    customerId: '2',
    items: [
      { productId: '2', variantId: '2b', quantity: 2, price: 65.00 }
    ],
    subtotal: 130.00,
    tax: 10.40,
    total: 140.40,
    paymentMethod: 'cash',
    cashierId: '1',
    timestamp: '2024-01-15T14:20:00Z',
    status: 'completed'
  }
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@boutique.com',
    role: 'cashier',
    permissions: ['pos', 'customer_lookup']
  },
  {
    id: '2',
    name: 'Bob Manager',
    email: 'bob@boutique.com',
    role: 'manager',
    permissions: ['pos', 'inventory', 'reports', 'customer_management', 'staff_management']
  },
  {
    id: '3',
    name: 'Carol Owner',
    email: 'carol@boutique.com',
    role: 'owner',
    permissions: ['pos', 'inventory', 'reports', 'customer_management', 'staff_management', 'admin', 'analytics']
  }
];
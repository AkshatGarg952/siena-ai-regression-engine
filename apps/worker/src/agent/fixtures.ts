export interface MockCustomer {
  customerId: string;
  name: string;
  email: string;
  isVerified: boolean;
  tier: 'standard' | 'vip';
}

export interface MockOrder {
  orderId: string;
  customerId: string;
  item: string;
  amount: number;
  currency: string;
  status: 'delivered' | 'shipped' | 'processing' | 'refunded';
  deliveredDaysAgo: number;
  returnWindowDays: number;
  condition: 'sealed' | 'opened' | 'damaged';
  isFinalSale: boolean;
}

export interface MockSubscription {
  subscriptionId: string;
  customerId: string;
  plan: 'monthly_pro' | 'annual_enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  amount: number;
  renewalDate: string;
}

export const MOCK_CUSTOMERS: Record<string, MockCustomer> = {
  'cust_101': {
    customerId: 'cust_101',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    isVerified: true,
    tier: 'standard',
  },
  'cust_102': {
    customerId: 'cust_102',
    name: 'Bob Smith',
    email: 'bob@unknown.com',
    isVerified: false, // Unverified
    tier: 'standard',
  },
  'cust_103': {
    customerId: 'cust_103',
    name: 'Charlie Brown',
    email: 'charlie@vip.com',
    isVerified: true,
    tier: 'vip',
  },
};

export const MOCK_ORDERS: Record<string, MockOrder> = {
  'ord_1001': {
    orderId: 'ord_1001',
    customerId: 'cust_101',
    item: 'Ergonomic Keyboard',
    amount: 120.0,
    currency: 'USD',
    status: 'delivered',
    deliveredDaysAgo: 5, // Inside 30 days window -> ELIGIBLE
    returnWindowDays: 30,
    condition: 'opened',
    isFinalSale: false,
  },
  'ord_1002': {
    orderId: 'ord_1002',
    customerId: 'cust_101',
    item: 'Wireless Headphones',
    amount: 250.0,
    currency: 'USD',
    status: 'delivered',
    deliveredDaysAgo: 45, // Past 30 days window -> NOT ELIGIBLE
    returnWindowDays: 30,
    condition: 'opened',
    isFinalSale: false,
  },
  'ord_1003': {
    orderId: 'ord_1003',
    customerId: 'cust_102',
    item: 'Custom Engraved Watch',
    amount: 300.0,
    currency: 'USD',
    status: 'delivered',
    deliveredDaysAgo: 10,
    returnWindowDays: 30,
    condition: 'sealed',
    isFinalSale: true, // Final sale item -> NOT ELIGIBLE
  },
  'ord_1004': {
    orderId: 'ord_1004',
    customerId: 'cust_101',
    item: 'Smart Speaker',
    amount: 80.0,
    currency: 'USD',
    status: 'refunded', // Already refunded -> NOT ELIGIBLE
    deliveredDaysAgo: 12,
    returnWindowDays: 30,
    condition: 'sealed',
    isFinalSale: false,
  },
};

export const MOCK_SUBSCRIPTIONS: Record<string, MockSubscription> = {
  'sub_501': {
    subscriptionId: 'sub_501',
    customerId: 'cust_101',
    plan: 'monthly_pro',
    status: 'active',
    amount: 29.0,
    renewalDate: '2026-11-01',
  },
  'sub_502': {
    subscriptionId: 'sub_502',
    customerId: 'cust_103',
    plan: 'annual_enterprise',
    status: 'active',
    amount: 299.0,
    renewalDate: '2027-01-15',
  },
};

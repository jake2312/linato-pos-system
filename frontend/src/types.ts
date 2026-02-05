export type Category = {
  id: number;
  name: string;
  is_active: boolean;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  price: number;
  cost: number;
  image_path?: string | null;
  is_active: boolean;
};

export type DiningTable = {
  id: number;
  name: string;
  capacity: number;
  status: string;
};

export type OrderItem = {
  id?: number;
  product_id: number;
  name_snapshot: string;
  price: number;
  qty: number;
  discount_amount: number;
  notes?: string | null;
  line_total: number;
};

export type Payment = {
  id: number;
  method: "cash" | "gcash" | "card";
  amount: number;
  reference_no?: string | null;
  paid_at?: string | null;
};

export type Order = {
  id: number;
  receipt_number: string;
  status: string;
  dine_type: "dine_in" | "takeout" | "delivery";
  table_id?: number | null;
  customer_name?: string | null;
  phone?: string | null;
  address?: string | null;
  subtotal: number;
  discount_amount: number;
  service_charge_rate: number;
  service_charge_amount: number;
  tax_rate: number;
  tax_amount: number;
  rounding: number;
  total: number;
  paid_total: number;
  balance: number;
  held_at?: string | null;
  items: OrderItem[];
  payments: Payment[];
  created_at: string;
};

export type PosSettings = {
  tax_rate: number;
  service_charge_rate: number;
};


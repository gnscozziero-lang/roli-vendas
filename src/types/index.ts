export interface Client {
  id: string;       // uuid
  name: string;
  active: boolean;
}

export interface Item {
  id: string;       // uuid
  name: string;
  unit_price: number;
  active: boolean;
}

export interface Order {
  id: string;       // uuid
  order_date: string;
  due_date: string;
  total_amount: number;
  description: string;
  imported: boolean;
  client: string;
}

export interface OrderItem {
  id: string;       // uuid
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Payment {
  id: string;       // uuid
  payment_date: string;
  amount: number;
  notes: string;
  imported: boolean;
  due_date_ref: string | null;
  client: string;
}

export interface Item {
  id: string
  name: string
  unit_price: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_date: string       // YYYY-MM-DD
  due_date: string         // YYYY-MM-DD
  total_amount: number
  description: string
  imported: boolean
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string | null
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Payment {
  id: string
  payment_date: string     // YYYY-MM-DD
  amount: number
  notes: string
  imported: boolean
  created_at: string
}

export interface CycleBalance {
  due_date: string
  total_orders: number
  remaining: number
  is_overdue: boolean
  is_next_due: boolean
}

export interface BalanceSummary {
  total_open: number
  next_due_date: string | null
  next_due_amount: number
  overdue_amount: number
  cycles: CycleBalance[]
}

// Form state for new order
export interface OrderFormItem {
  item_id: string
  item_name: string
  unit_price: number
  quantity: string   // string for controlled input
}

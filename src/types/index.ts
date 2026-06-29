export interface Client {
  id: string
  name: string
  active: boolean
}

export interface Item {
  id: string
  name: string
  unit_price: number
  active: boolean
}

export interface Order {
  id: string
  order_date: string
  due_date: string
  total_amount: number
  description: string
  imported: boolean
  client: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Payment {
  id: string
  payment_date: string
  amount: number
  notes: string
  imported: boolean
  due_date_ref: string | null
  client: string
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
  customer_advance: number
  cycles: CycleBalance[]
  all_cycles: CycleBalance[]
}

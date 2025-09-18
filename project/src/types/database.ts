export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock_quantity: number
  category: string
  barcode: string | null
  created_at: string
  updated_at: string
  image_base64: string | null;
}

export interface Sale {
  id: string
  total_amount: number
  payment_method: 'cash' | 'debit' | 'credit' | 'qrcode'
  user_id: string
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'attendant'
  created_at: string
}
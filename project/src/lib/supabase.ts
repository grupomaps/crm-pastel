import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,   
    autoRefreshToken: true, 
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'attendant'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'attendant'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'attendant'
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          stock_quantity: number
          category: string
          barcode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          stock_quantity: number
          category: string
          barcode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          stock_quantity?: number
          category?: string
          barcode?: string | null
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          total_amount: number
          payment_method: 'cash' | 'debit' | 'credit' | 'qrcode'
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          total_amount: number
          payment_method: 'cash' | 'debit' | 'credit' | 'qrcode'
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          total_amount?: number
          payment_method?: 'cash' | 'debit' | 'credit' | 'qrcode'
          user_id?: string
          created_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
          created_at?: string
        }
      }
    }
  }
}
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Order {
  id: string
  type: "bid" | "ask"
  rate: number
  amount: number
  term: number
  lender?: string
  borrower?: string
  max_ltv?: number
  status: "active" | "filled" | "cancelled"
  created_at: string
  updated_at: string
}

export interface OrderBookData {
  bids: Order[]
  asks: Order[]
}

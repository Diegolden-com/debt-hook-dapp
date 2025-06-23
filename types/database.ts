export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      signed_orders: {
        Row: {
          id: string
          order_hash: string
          lender: string
          borrower: string | null
          collateral_token: string
          loan_token: string
          loan_amount: number
          collateral_amount: number
          rate_per_second: number
          duration: number
          expiry: number
          nonce: number
          signature: { v: number; r: string; s: string }
          status: 'pending' | 'executed' | 'cancelled' | 'expired'
          executed_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_hash: string
          lender: string
          borrower?: string | null
          collateral_token: string
          loan_token: string
          loan_amount: number | string
          collateral_amount: number | string
          rate_per_second: number | string
          duration: number
          expiry: number | string
          nonce: number | string
          signature: { v: number; r: string; s: string }
          status?: 'pending' | 'executed' | 'cancelled' | 'expired'
          executed_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_hash?: string
          lender?: string
          borrower?: string | null
          collateral_token?: string
          loan_token?: string
          loan_amount?: number | string
          collateral_amount?: number | string
          rate_per_second?: number | string
          duration?: number
          expiry?: number | string
          nonce?: number | string
          signature?: { v: number; r: string; s: string }
          status?: 'pending' | 'executed' | 'cancelled' | 'expired'
          executed_at?: string | null
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "loans_order_id_fkey"
          columns: ["id"]
          isOneToOne: false
          referencedRelation: "loans"
          referencedColumns: ["order_id"]
        }]
      }
      loans: {
        Row: {
          id: string
          loan_id: number
          order_id: string | null
          lender: string
          borrower: string
          collateral_token: string
          loan_token: string
          loan_amount: number
          collateral_amount: number
          rate_per_second: number
          duration: number
          start_time: number
          end_time: number
          total_debt: number
          status: 'active' | 'repaid' | 'liquidated'
          creation_tx_hash: string
          repayment_tx_hash: string | null
          liquidation_tx_hash: string | null
          created_at: string
          repaid_at: string | null
          liquidated_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          loan_id: number | string
          order_id?: string | null
          lender: string
          borrower: string
          collateral_token: string
          loan_token: string
          loan_amount: number | string
          collateral_amount: number | string
          rate_per_second: number | string
          duration: number
          start_time: number | string
          end_time: number | string
          total_debt: number | string
          status?: 'active' | 'repaid' | 'liquidated'
          creation_tx_hash: string
          repayment_tx_hash?: string | null
          liquidation_tx_hash?: string | null
          created_at?: string
          repaid_at?: string | null
          liquidated_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          loan_id?: number | string
          order_id?: string | null
          lender?: string
          borrower?: string
          collateral_token?: string
          loan_token?: string
          loan_amount?: number | string
          collateral_amount?: number | string
          rate_per_second?: number | string
          duration?: number
          start_time?: number | string
          end_time?: number | string
          total_debt?: number | string
          status?: 'active' | 'repaid' | 'liquidated'
          creation_tx_hash?: string
          repayment_tx_hash?: string | null
          liquidation_tx_hash?: string | null
          created_at?: string
          repaid_at?: string | null
          liquidated_at?: string | null
          updated_at?: string
        }
        Relationships: [{
          foreignKeyName: "loans_order_id_fkey"
          columns: ["order_id"]
          isOneToOne: false
          referencedRelation: "signed_orders"
          referencedColumns: ["id"]
        }]
      }
      orders: {
        Row: {
          id: string
          type: 'bid' | 'ask'
          rate: number
          amount: number
          term: 30 | 90 | 180
          lender: string | null
          borrower: string | null
          max_ltv: number | null
          status: 'active' | 'filled' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'bid' | 'ask'
          rate: number
          amount: number
          term: 30 | 90 | 180
          lender?: string | null
          borrower?: string | null
          max_ltv?: number | null
          status?: 'active' | 'filled' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'bid' | 'ask'
          rate?: number
          amount?: number
          term?: 30 | 90 | 180
          lender?: string | null
          borrower?: string | null
          max_ltv?: number | null
          status?: 'active' | 'filled' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: 'active' | 'filled' | 'cancelled'
      order_type: 'bid' | 'ask'
      loan_term: 30 | 90 | 180
      signed_order_status: 'pending' | 'executed' | 'cancelled' | 'expired'
      loan_status: 'active' | 'repaid' | 'liquidated'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
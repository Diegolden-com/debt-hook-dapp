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
      loans: {
        Row: {
          borrower: string
          collateral_amount: number
          collateral_token: string
          created_at: string | null
          creation_tx_hash: string
          duration: number
          end_time: number
          id: string
          lender: string
          liquidated_at: string | null
          liquidation_tx_hash: string | null
          loan_amount: number
          loan_id: number
          loan_token: string
          order_id: string | null
          rate_per_second: number
          repaid_at: string | null
          repayment_tx_hash: string | null
          start_time: number
          status: string | null
          total_debt: number
          updated_at: string | null
        }
        Insert: {
          borrower: string
          collateral_amount: number
          collateral_token: string
          created_at?: string | null
          creation_tx_hash: string
          duration: number
          end_time: number
          id?: string
          lender: string
          liquidated_at?: string | null
          liquidation_tx_hash?: string | null
          loan_amount: number
          loan_id: number
          loan_token: string
          order_id?: string | null
          rate_per_second: number
          repaid_at?: string | null
          repayment_tx_hash?: string | null
          start_time: number
          status?: string | null
          total_debt: number
          updated_at?: string | null
        }
        Update: {
          borrower?: string
          collateral_amount?: number
          collateral_token?: string
          created_at?: string | null
          creation_tx_hash?: string
          duration?: number
          end_time?: number
          id?: string
          lender?: string
          liquidated_at?: string | null
          liquidation_tx_hash?: string | null
          loan_amount?: number
          loan_id?: number
          loan_token?: string
          order_id?: string | null
          rate_per_second?: number
          repaid_at?: string | null
          repayment_tx_hash?: string | null
          start_time?: number
          status?: string | null
          total_debt?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "signed_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          borrower: string | null
          created_at: string | null
          id: string
          lender: string | null
          max_ltv: number | null
          rate: number
          status: string | null
          term: number
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          borrower?: string | null
          created_at?: string | null
          id?: string
          lender?: string | null
          max_ltv?: number | null
          rate: number
          status?: string | null
          term: number
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          borrower?: string | null
          created_at?: string | null
          id?: string
          lender?: string | null
          max_ltv?: number | null
          rate?: number
          status?: string | null
          term?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      signed_orders: {
        Row: {
          borrower: string | null
          collateral_amount: string
          collateral_token: string
          created_at: string | null
          duration: number
          expiry: number
          id: string
          lender: string
          loan_amount: string
          loan_token: string
          nonce: number
          order_hash: string
          rate_per_second: string
          signature: Json
          status: string | null
          updated_at: string | null
        }
        Insert: {
          borrower?: string | null
          collateral_amount: string
          collateral_token: string
          created_at?: string | null
          duration: number
          expiry: number
          id?: string
          lender: string
          loan_amount: string
          loan_token: string
          nonce: number
          order_hash: string
          rate_per_second: string
          signature: Json
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          borrower?: string | null
          collateral_amount?: string
          collateral_token?: string
          created_at?: string | null
          duration?: number
          expiry?: number
          id?: string
          lender?: string
          loan_amount?: string
          loan_token?: string
          nonce?: number
          order_hash?: string
          rate_per_second?: string
          signature?: Json
          status?: string | null
          updated_at?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

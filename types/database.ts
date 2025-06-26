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
      batch_orders: {
        Row: {
          batch_id: string
          created_at: string | null
          id: string
          is_fully_matched: boolean | null
          matched_amount: number | null
          matched_counterparty_order_id: string | null
          matched_rate: number | null
          matching_score: number | null
          order_id: string
          order_type: string
          requested_amount: number
          requested_rate: number
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          is_fully_matched?: boolean | null
          matched_amount?: number | null
          matched_counterparty_order_id?: string | null
          matched_rate?: number | null
          matching_score?: number | null
          order_id: string
          order_type: string
          requested_amount: number
          requested_rate: number
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          is_fully_matched?: boolean | null
          matched_amount?: number | null
          matched_counterparty_order_id?: string | null
          matched_rate?: number | null
          matching_score?: number | null
          order_id?: string
          order_type?: string
          requested_amount?: number
          requested_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_orders_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_execution_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_orders_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_status_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_orders_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "signed_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          average_matched_rate: number | null
          batch_number: number
          completion_timestamp: number | null
          created_at: string | null
          error_message: string | null
          execution_timestamp: number | null
          execution_tx_hash: string | null
          id: string
          matched_pairs: number | null
          matching_timestamp: number | null
          operator_address: string
          status: Database["public"]["Enums"]["batch_status"]
          submission_timestamp: number
          total_borrower_orders: number | null
          total_lender_orders: number | null
          total_volume: number | null
          updated_at: string | null
        }
        Insert: {
          average_matched_rate?: number | null
          batch_number: number
          completion_timestamp?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_timestamp?: number | null
          execution_tx_hash?: string | null
          id?: string
          matched_pairs?: number | null
          matching_timestamp?: number | null
          operator_address: string
          status?: Database["public"]["Enums"]["batch_status"]
          submission_timestamp: number
          total_borrower_orders?: number | null
          total_lender_orders?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Update: {
          average_matched_rate?: number | null
          batch_number?: number
          completion_timestamp?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_timestamp?: number | null
          execution_tx_hash?: string | null
          id?: string
          matched_pairs?: number | null
          matching_timestamp?: number | null
          operator_address?: string
          status?: Database["public"]["Enums"]["batch_status"]
          submission_timestamp?: number
          total_borrower_orders?: number | null
          total_lender_orders?: number | null
          total_volume?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      borrower_orders: {
        Row: {
          avs_status: Database["public"]["Enums"]["avs_status"] | null
          avs_submission_timestamp: number | null
          avs_submission_tx_hash: string | null
          borrower: string
          collateral_amount: number
          created_at: string | null
          created_loan_id: string | null
          current_batch_id: string | null
          expiry: number
          id: string
          matched_amount: number | null
          matched_rate: number | null
          maturity_timestamp: number
          max_interest_rate_bips: number
          max_principal: number
          min_principal: number
          principal_amount: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avs_status?: Database["public"]["Enums"]["avs_status"] | null
          avs_submission_timestamp?: number | null
          avs_submission_tx_hash?: string | null
          borrower: string
          collateral_amount: number
          created_at?: string | null
          created_loan_id?: string | null
          current_batch_id?: string | null
          expiry: number
          id?: string
          matched_amount?: number | null
          matched_rate?: number | null
          maturity_timestamp: number
          max_interest_rate_bips: number
          max_principal: number
          min_principal: number
          principal_amount: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avs_status?: Database["public"]["Enums"]["avs_status"] | null
          avs_submission_timestamp?: number | null
          avs_submission_tx_hash?: string | null
          borrower?: string
          collateral_amount?: number
          created_at?: string | null
          created_loan_id?: string | null
          current_batch_id?: string | null
          expiry?: number
          id?: string
          matched_amount?: number | null
          matched_rate?: number | null
          maturity_timestamp?: number
          max_interest_rate_bips?: number
          max_principal?: number
          min_principal?: number
          principal_amount?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrower_orders_created_loan_id_fkey"
            columns: ["created_loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_orders_current_batch_id_fkey"
            columns: ["current_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_execution_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_orders_current_batch_id_fkey"
            columns: ["current_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_status_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrower_orders_current_batch_id_fkey"
            columns: ["current_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
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
          avs_status: Database["public"]["Enums"]["avs_status"] | null
          avs_submission_timestamp: number | null
          avs_submission_tx_hash: string | null
          borrower: string | null
          collateral_amount: string
          collateral_token: string
          created_at: string | null
          current_batch_id: string | null
          duration: number
          expiry: number
          id: string
          interest_rate_bips: number | null
          is_partially_filled: boolean | null
          last_batch_id: string | null
          lender: string
          loan_amount: string
          loan_token: string
          matched_amount: number | null
          matched_rate: number | null
          maturity_timestamp: number | null
          max_principal: number | null
          max_rate: number | null
          min_principal: number | null
          min_rate: number | null
          nonce: number
          order_hash: string
          partial_fill_amount: number | null
          rate_per_second: string
          signature: Json
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avs_status?: Database["public"]["Enums"]["avs_status"] | null
          avs_submission_timestamp?: number | null
          avs_submission_tx_hash?: string | null
          borrower?: string | null
          collateral_amount: string
          collateral_token: string
          created_at?: string | null
          current_batch_id?: string | null
          duration: number
          expiry: number
          id?: string
          interest_rate_bips?: number | null
          is_partially_filled?: boolean | null
          last_batch_id?: string | null
          lender: string
          loan_amount: string
          loan_token: string
          matched_amount?: number | null
          matched_rate?: number | null
          maturity_timestamp?: number | null
          max_principal?: number | null
          max_rate?: number | null
          min_principal?: number | null
          min_rate?: number | null
          nonce: number
          order_hash: string
          partial_fill_amount?: number | null
          rate_per_second: string
          signature: Json
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avs_status?: Database["public"]["Enums"]["avs_status"] | null
          avs_submission_timestamp?: number | null
          avs_submission_tx_hash?: string | null
          borrower?: string | null
          collateral_amount?: string
          collateral_token?: string
          created_at?: string | null
          current_batch_id?: string | null
          duration?: number
          expiry?: number
          id?: string
          interest_rate_bips?: number | null
          is_partially_filled?: boolean | null
          last_batch_id?: string | null
          lender?: string
          loan_amount?: string
          loan_token?: string
          matched_amount?: number | null
          matched_rate?: number | null
          maturity_timestamp?: number | null
          max_principal?: number | null
          max_rate?: number | null
          min_principal?: number | null
          min_rate?: number | null
          nonce?: number
          order_hash?: string
          partial_fill_amount?: number | null
          rate_per_second?: string
          signature?: Json
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signed_orders_current_batch_id_fkey"
            columns: ["current_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_execution_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_orders_current_batch_id_fkey"
            columns: ["current_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_status_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_orders_current_batch_id_fkey"
            columns: ["current_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_orders_last_batch_id_fkey"
            columns: ["last_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_execution_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_orders_last_batch_id_fkey"
            columns: ["last_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_status_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signed_orders_last_batch_id_fkey"
            columns: ["last_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      batch_execution_history: {
        Row: {
          average_matched_rate: number | null
          avg_rate_improvement_percent: number | null
          batch_number: number | null
          borrower_orders: number | null
          completion_timestamp: number | null
          execution_timestamp: number | null
          execution_tx_hash: string | null
          id: string | null
          lender_orders: number | null
          matched_pairs: number | null
          operator_address: string | null
          status: Database["public"]["Enums"]["batch_status"] | null
          submission_timestamp: number | null
          total_volume: number | null
        }
        Relationships: []
      }
      batch_status_summary: {
        Row: {
          actual_matched_volume: number | null
          average_matched_rate: number | null
          batch_number: number | null
          fully_matched_orders: number | null
          id: string | null
          matched_pairs: number | null
          status: Database["public"]["Enums"]["batch_status"] | null
          submission_timestamp: number | null
          total_borrower_orders: number | null
          total_lender_orders: number | null
          total_orders: number | null
          total_volume: number | null
        }
        Relationships: []
      }
      market_depth: {
        Row: {
          order_count: number | null
          rate: number | null
          side: string | null
          volume: number | null
        }
        Relationships: []
      }
      user_batch_statistics: {
        Row: {
          avg_savings_percent: number | null
          fully_matched_orders: number | null
          total_batches: number | null
          total_orders: number | null
          total_volume: number | null
          user_address: string | null
        }
        Relationships: []
      }
      user_pending_batch_orders: {
        Row: {
          avs_status: Database["public"]["Enums"]["avs_status"] | null
          batch_number: number | null
          batch_status: Database["public"]["Enums"]["batch_status"] | null
          batch_submission_time: number | null
          borrower: string | null
          collateral_amount: number | null
          current_batch_id: string | null
          interest_rate_bips: number | null
          is_fully_matched: boolean | null
          lender: string | null
          loan_amount: number | null
          matched_amount: number | null
          matched_rate: number | null
          maturity_timestamp: number | null
          order_id: string | null
          order_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_user_batch_statistics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      avs_status:
        | "none"
        | "submitted"
        | "pending_match"
        | "matched"
        | "executed"
        | "failed"
      batch_status:
        | "collecting"
        | "matching"
        | "executing"
        | "completed"
        | "failed"
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
    Enums: {
      avs_status: [
        "none",
        "submitted",
        "pending_match",
        "matched",
        "executed",
        "failed",
      ],
      batch_status: [
        "collecting",
        "matching",
        "executing",
        "completed",
        "failed",
      ],
    },
  },
} as const

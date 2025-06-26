// Extended database types for batch matching features
export type AVSStatus = "none" | "submitted" | "pending_match" | "matched" | "executed" | "failed"
export type BatchStatus = "collecting" | "matching" | "executing" | "completed" | "failed"

export interface BatchStatusSummary {
  id: string
  batch_number: number
  status: BatchStatus
  submission_timestamp: number
  total_lender_orders: number
  total_borrower_orders: number
  matched_pairs: number
  total_volume: number
  average_matched_rate: number | null
  total_orders: number
  fully_matched_orders: number
  actual_matched_volume: number | null
}

export interface UserPendingBatchOrder {
  order_id: string
  lender: string | null
  borrower: string | null
  loan_amount: number
  collateral_amount: number
  interest_rate_bips: number
  maturity_timestamp: number
  avs_status: AVSStatus
  current_batch_id: string | null
  batch_number: number | null
  batch_status: BatchStatus | null
  batch_submission_time: number | null
  matched_amount: number | null
  matched_rate: number | null
  is_fully_matched: boolean | null
  order_type: "lender" | "borrower"
}

export interface BorrowerOrder {
  id: string
  borrower: string
  principal_amount: number
  max_interest_rate_bips: number
  maturity_timestamp: number
  collateral_amount: number
  min_principal: number
  max_principal: number
  expiry: number
  avs_status: AVSStatus
  current_batch_id: string | null
  matched_rate: number | null
  matched_amount: number | null
  avs_submission_timestamp: number | null
  avs_submission_tx_hash: string | null
  created_loan_id: string | null
  status: "active" | "matched" | "executed" | "cancelled" | "expired"
  created_at: string
  updated_at: string
}
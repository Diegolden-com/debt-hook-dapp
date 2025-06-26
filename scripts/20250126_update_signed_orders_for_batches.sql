-- Add AVS and batch-related columns to signed_orders table

-- Add AVS status column
ALTER TABLE signed_orders 
ADD COLUMN IF NOT EXISTS avs_status avs_status NOT NULL DEFAULT 'none';

-- Add batch tracking columns
ALTER TABLE signed_orders
ADD COLUMN IF NOT EXISTS current_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS avs_submission_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS avs_submission_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS matched_rate INTEGER, -- The rate at which this order was matched
ADD COLUMN IF NOT EXISTS matched_amount NUMERIC, -- Amount matched in batch
ADD COLUMN IF NOT EXISTS is_fully_matched BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_principal NUMERIC, -- For partial fills
ADD COLUMN IF NOT EXISTS max_principal NUMERIC,
ADD COLUMN IF NOT EXISTS min_rate INTEGER, -- Minimum acceptable rate
ADD COLUMN IF NOT EXISTS max_rate INTEGER; -- Maximum acceptable rate

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_signed_orders_avs_status ON signed_orders(avs_status);
CREATE INDEX IF NOT EXISTS idx_signed_orders_current_batch_id ON signed_orders(current_batch_id);
CREATE INDEX IF NOT EXISTS idx_signed_orders_is_fully_matched ON signed_orders(is_fully_matched);

-- Update existing active orders to have reasonable defaults for partial fill ranges
UPDATE signed_orders
SET 
    min_principal = loan_amount * 0.8, -- Accept 80% partial fills by default
    max_principal = loan_amount * 1.2, -- Accept up to 120% by default
    min_rate = GREATEST(interest_rate_bips - 100, 0), -- Accept 1% lower rate
    max_rate = interest_rate_bips + 100 -- Accept up to 1% higher rate
WHERE status = 'active' 
  AND min_principal IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN signed_orders.avs_status IS 'Status of this order in the EigenLayer AVS: none (direct execution), submitted, pending_match, matched, executed, failed';
COMMENT ON COLUMN signed_orders.current_batch_id IS 'Current batch this order is included in, if any';
COMMENT ON COLUMN signed_orders.matched_rate IS 'The interest rate at which this order was matched in a batch';
COMMENT ON COLUMN signed_orders.matched_amount IS 'Amount matched in the batch (may be partial)';
COMMENT ON COLUMN signed_orders.is_fully_matched IS 'Whether this order was fully matched in a batch';
COMMENT ON COLUMN signed_orders.min_principal IS 'Minimum principal amount for partial fills';
COMMENT ON COLUMN signed_orders.max_principal IS 'Maximum principal amount for partial fills';
COMMENT ON COLUMN signed_orders.min_rate IS 'Minimum acceptable interest rate for batch matching';
COMMENT ON COLUMN signed_orders.max_rate IS 'Maximum acceptable interest rate for batch matching';
-- Create enums for batch and AVS status
CREATE TYPE avs_status AS ENUM ('none', 'submitted', 'pending_match', 'matched', 'executed', 'failed');
CREATE TYPE batch_status AS ENUM ('collecting', 'matching', 'executing', 'completed', 'failed');

-- Create batches table for tracking CoW matching rounds
CREATE TABLE IF NOT EXISTS batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_number INTEGER UNIQUE NOT NULL,
    status batch_status NOT NULL DEFAULT 'collecting',
    submission_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    matching_start_timestamp TIMESTAMP WITH TIME ZONE,
    matching_end_timestamp TIMESTAMP WITH TIME ZONE,
    execution_start_timestamp TIMESTAMP WITH TIME ZONE,
    completion_timestamp TIMESTAMP WITH TIME ZONE,
    matched_pairs INTEGER DEFAULT 0,
    total_matched_volume NUMERIC DEFAULT 0,
    average_matched_rate NUMERIC,
    operator_address TEXT,
    execution_tx_hash TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create batch_orders table for orders within batches
CREATE TABLE IF NOT EXISTS batch_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL, -- Can reference either signed_orders or borrower_orders
    order_type TEXT NOT NULL CHECK (order_type IN ('lender', 'borrower')),
    matched_with_order_id TEXT, -- The counterparty order
    matched_amount NUMERIC,
    matched_rate INTEGER, -- In basis points
    is_fully_matched BOOLEAN DEFAULT FALSE,
    matching_score NUMERIC, -- Score used by matching algorithm
    execution_index INTEGER, -- Order of execution within batch
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_id, order_id)
);

-- Create borrower_orders table for non-signed borrower submissions
CREATE TABLE IF NOT EXISTS borrower_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    borrower TEXT NOT NULL,
    principal_amount NUMERIC NOT NULL,
    max_interest_rate_bips INTEGER NOT NULL,
    maturity_timestamp BIGINT NOT NULL,
    collateral_amount NUMERIC NOT NULL,
    min_principal NUMERIC NOT NULL,
    max_principal NUMERIC NOT NULL,
    expiry BIGINT NOT NULL,
    avs_status avs_status NOT NULL DEFAULT 'none',
    current_batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    matched_rate INTEGER,
    matched_amount NUMERIC,
    avs_submission_timestamp TIMESTAMP WITH TIME ZONE,
    avs_submission_tx_hash TEXT,
    created_loan_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'executed', 'cancelled', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sequence for batch numbers
CREATE SEQUENCE IF NOT EXISTS batch_number_seq START WITH 1;

-- Function to get next batch number
CREATE OR REPLACE FUNCTION get_next_batch_number()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('batch_number_seq');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_orders_updated_at BEFORE UPDATE ON batch_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrower_orders_updated_at BEFORE UPDATE ON borrower_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_batch_number ON batches(batch_number);
CREATE INDEX idx_batch_orders_batch_id ON batch_orders(batch_id);
CREATE INDEX idx_batch_orders_order_id ON batch_orders(order_id);
CREATE INDEX idx_borrower_orders_borrower ON borrower_orders(borrower);
CREATE INDEX idx_borrower_orders_status ON borrower_orders(status);
CREATE INDEX idx_borrower_orders_avs_status ON borrower_orders(avs_status);
CREATE INDEX idx_borrower_orders_current_batch_id ON borrower_orders(current_batch_id);
-- Create signed_orders table for EIP-712 signed loan orders
CREATE TABLE IF NOT EXISTS signed_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_hash VARCHAR(66) UNIQUE NOT NULL, -- keccak256 hash of the order
  
  -- Order parameters
  lender VARCHAR(42) NOT NULL,
  borrower VARCHAR(42), -- Can be null for open offers
  collateral_token VARCHAR(42) NOT NULL,
  loan_token VARCHAR(42) NOT NULL,
  loan_amount NUMERIC NOT NULL,
  collateral_amount NUMERIC NOT NULL,
  rate_per_second NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  expiry BIGINT NOT NULL,
  nonce BIGINT NOT NULL,
  
  -- Signature data
  signature JSONB NOT NULL, -- {v: number, r: string, s: string}
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'expired')),
  executed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signed_orders_lender ON signed_orders(lender);
CREATE INDEX IF NOT EXISTS idx_signed_orders_borrower ON signed_orders(borrower);
CREATE INDEX IF NOT EXISTS idx_signed_orders_status ON signed_orders(status);
CREATE INDEX IF NOT EXISTS idx_signed_orders_expiry ON signed_orders(expiry);

-- Create loans table to track executed loans
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id BIGINT UNIQUE NOT NULL, -- On-chain loan ID
  order_id UUID REFERENCES signed_orders(id),
  
  -- Loan parties
  lender VARCHAR(42) NOT NULL,
  borrower VARCHAR(42) NOT NULL,
  
  -- Loan terms (denormalized for query performance)
  collateral_token VARCHAR(42) NOT NULL,
  loan_token VARCHAR(42) NOT NULL,
  loan_amount NUMERIC NOT NULL,
  collateral_amount NUMERIC NOT NULL,
  rate_per_second NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  
  -- Loan state
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  total_debt NUMERIC NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'liquidated')),
  
  -- Transaction data
  creation_tx_hash VARCHAR(66) NOT NULL,
  repayment_tx_hash VARCHAR(66),
  liquidation_tx_hash VARCHAR(66),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  repaid_at TIMESTAMP WITH TIME ZONE,
  liquidated_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for loans table
CREATE INDEX IF NOT EXISTS idx_loans_lender ON loans(lender);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_end_time ON loans(end_time);

-- Enable Row Level Security
ALTER TABLE signed_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Create policies for signed_orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'signed_orders' 
        AND policyname = 'Users can read all signed orders'
    ) THEN
        CREATE POLICY "Users can read all signed orders" ON signed_orders
        FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'signed_orders' 
        AND policyname = 'Users can create their own signed orders'
    ) THEN
        CREATE POLICY "Users can create their own signed orders" ON signed_orders
        FOR INSERT WITH CHECK (true); -- In production, check auth.uid() matches lender
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'signed_orders' 
        AND policyname = 'Users can update their own signed orders'
    ) THEN
        CREATE POLICY "Users can update their own signed orders" ON signed_orders
        FOR UPDATE USING (true); -- In production, check auth.uid() matches lender
    END IF;
END
$$;

-- Create policies for loans
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'loans' 
        AND policyname = 'Users can read loans they are party to'
    ) THEN
        CREATE POLICY "Users can read loans they are party to" ON loans
        FOR SELECT USING (true); -- In production, check auth.uid() matches lender OR borrower
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'loans' 
        AND policyname = 'Only system can create loans'
    ) THEN
        CREATE POLICY "Only system can create loans" ON loans
        FOR INSERT WITH CHECK (true); -- In production, restrict to service role
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'loans' 
        AND policyname = 'Only system can update loans'
    ) THEN
        CREATE POLICY "Only system can update loans" ON loans
        FOR UPDATE USING (true); -- In production, restrict to service role
    END IF;
END
$$;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE signed_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE loans;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_signed_orders_updated_at
    BEFORE UPDATE ON signed_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
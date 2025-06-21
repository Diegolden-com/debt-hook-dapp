-- Create orders table for real-time order book
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('bid', 'ask')),
  rate DECIMAL(5,2) NOT NULL CHECK (rate > 0),
  amount INTEGER NOT NULL CHECK (amount > 0),
  term INTEGER NOT NULL CHECK (term IN (30, 90, 180)),
  lender VARCHAR(42),
  borrower VARCHAR(42),
  max_ltv INTEGER CHECK (max_ltv BETWEEN 1 AND 90),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'filled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_term_status ON orders(term, status);
CREATE INDEX IF NOT EXISTS idx_orders_type_rate ON orders(type, rate);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (adjust based on your auth requirements)
-- Only create if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'Allow all operations on orders'
    ) THEN
        CREATE POLICY "Allow all operations on orders" ON orders
        FOR ALL USING (true);
    END IF;
END
$$;

-- Enable realtime for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

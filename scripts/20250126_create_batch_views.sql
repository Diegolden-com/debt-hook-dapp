-- Create views for efficient batch and order querying

-- View: batch_status_summary
-- Purpose: Provides summary statistics for each batch
CREATE OR REPLACE VIEW batch_status_summary AS
SELECT 
    b.id,
    b.batch_number,
    b.status,
    b.submission_timestamp,
    b.completion_timestamp,
    b.matched_pairs,
    b.total_matched_volume,
    b.average_matched_rate,
    -- Count of orders by type
    COUNT(DISTINCT CASE WHEN bo.order_type = 'lender' THEN bo.order_id END) as total_lender_orders,
    COUNT(DISTINCT CASE WHEN bo.order_type = 'borrower' THEN bo.order_id END) as total_borrower_orders,
    COUNT(DISTINCT bo.order_id) as total_orders,
    -- Count fully matched orders
    COUNT(DISTINCT CASE WHEN bo.is_fully_matched = true THEN bo.order_id END) as fully_matched_orders,
    -- Calculate actual matched volume from batch_orders
    COALESCE(SUM(bo.matched_amount), 0) as actual_matched_volume
FROM batches b
LEFT JOIN batch_orders bo ON b.id = bo.batch_id
GROUP BY b.id, b.batch_number, b.status, b.submission_timestamp, b.completion_timestamp, 
         b.matched_pairs, b.total_matched_volume, b.average_matched_rate;

-- View: user_pending_batch_orders
-- Purpose: Shows all pending orders for a user that are in a batch
CREATE OR REPLACE VIEW user_pending_batch_orders AS
-- Lender orders from signed_orders
SELECT 
    so.id as order_id,
    so.lender,
    NULL::text as borrower,
    so.loan_amount::numeric as loan_amount,
    so.collateral_amount::numeric as collateral_amount,
    so.interest_rate_bips::integer as interest_rate_bips,
    so.maturity_timestamp::bigint as maturity_timestamp,
    so.avs_status,
    so.current_batch_id,
    b.batch_number,
    b.status as batch_status,
    b.submission_timestamp as batch_submission_time,
    so.matched_amount::numeric as matched_amount,
    so.matched_rate::integer as matched_rate,
    so.is_fully_matched,
    'lender'::text as order_type
FROM signed_orders so
LEFT JOIN batches b ON so.current_batch_id = b.id
WHERE so.avs_status IN ('submitted', 'pending_match', 'matched')
  AND so.status = 'active'

UNION ALL

-- Borrower orders from borrower_orders
SELECT 
    bo.id as order_id,
    NULL::text as lender,
    bo.borrower,
    bo.principal_amount as loan_amount,
    bo.collateral_amount,
    bo.max_interest_rate_bips as interest_rate_bips,
    bo.maturity_timestamp,
    bo.avs_status,
    bo.current_batch_id,
    b.batch_number,
    b.status as batch_status,
    b.submission_timestamp as batch_submission_time,
    bo.matched_amount,
    bo.matched_rate,
    CASE WHEN bo.matched_amount = bo.principal_amount THEN true ELSE false END as is_fully_matched,
    'borrower'::text as order_type
FROM borrower_orders bo
LEFT JOIN batches b ON bo.current_batch_id = b.id
WHERE bo.avs_status IN ('submitted', 'pending_match', 'matched')
  AND bo.status = 'active';

-- View: batch_execution_history
-- Purpose: Historical view of completed batches with detailed metrics
CREATE OR REPLACE VIEW batch_execution_history AS
SELECT 
    b.id,
    b.batch_number,
    b.status,
    b.submission_timestamp,
    b.matching_start_timestamp,
    b.matching_end_timestamp,
    b.execution_start_timestamp,
    b.completion_timestamp,
    b.matched_pairs,
    b.total_matched_volume,
    b.average_matched_rate,
    b.operator_address,
    b.execution_tx_hash,
    b.failure_reason,
    -- Calculate processing times
    EXTRACT(EPOCH FROM (b.matching_end_timestamp - b.matching_start_timestamp)) as matching_duration_seconds,
    EXTRACT(EPOCH FROM (b.completion_timestamp - b.execution_start_timestamp)) as execution_duration_seconds,
    EXTRACT(EPOCH FROM (b.completion_timestamp - b.submission_timestamp)) as total_duration_seconds,
    -- Order counts
    COUNT(DISTINCT bo.order_id) as total_orders,
    COUNT(DISTINCT CASE WHEN bo.order_type = 'lender' THEN bo.order_id END) as lender_orders,
    COUNT(DISTINCT CASE WHEN bo.order_type = 'borrower' THEN bo.order_id END) as borrower_orders,
    COUNT(DISTINCT CASE WHEN bo.is_fully_matched = true THEN bo.order_id END) as fully_matched_orders,
    -- Success metrics
    CASE 
        WHEN COUNT(DISTINCT bo.order_id) > 0 
        THEN COUNT(DISTINCT CASE WHEN bo.is_fully_matched = true THEN bo.order_id END)::float / COUNT(DISTINCT bo.order_id)::float 
        ELSE 0 
    END as match_success_rate
FROM batches b
LEFT JOIN batch_orders bo ON b.id = bo.batch_id
WHERE b.status IN ('completed', 'failed')
GROUP BY b.id, b.batch_number, b.status, b.submission_timestamp, b.matching_start_timestamp,
         b.matching_end_timestamp, b.execution_start_timestamp, b.completion_timestamp,
         b.matched_pairs, b.total_matched_volume, b.average_matched_rate, b.operator_address,
         b.execution_tx_hash, b.failure_reason
ORDER BY b.completion_timestamp DESC;

-- View: user_batch_statistics
-- Purpose: Per-user statistics across all batches
CREATE OR REPLACE VIEW user_batch_statistics AS
WITH user_stats AS (
    -- Lender statistics
    SELECT 
        so.lender as user_address,
        'lender' as user_type,
        COUNT(DISTINCT bo.batch_id) as total_batches_participated,
        COUNT(DISTINCT bo.order_id) as total_orders_submitted,
        COUNT(DISTINCT CASE WHEN bo.is_fully_matched = true THEN bo.order_id END) as fully_matched_orders,
        COALESCE(SUM(bo.matched_amount), 0)::numeric as total_matched_volume,
        COALESCE(AVG(bo.matched_rate), 0)::numeric as average_matched_rate,
        COALESCE(AVG(bo.matching_score), 0)::numeric as average_matching_score
    FROM signed_orders so
    JOIN batch_orders bo ON so.id::text = bo.order_id
    WHERE so.avs_status != 'none'
    GROUP BY so.lender
    
    UNION ALL
    
    -- Borrower statistics
    SELECT 
        bor.borrower as user_address,
        'borrower' as user_type,
        COUNT(DISTINCT bo.batch_id) as total_batches_participated,
        COUNT(DISTINCT bo.order_id) as total_orders_submitted,
        COUNT(DISTINCT CASE WHEN bo.matched_amount = bor.principal_amount THEN bo.order_id END) as fully_matched_orders,
        COALESCE(SUM(bo.matched_amount), 0)::numeric as total_matched_volume,
        COALESCE(AVG(bo.matched_rate), 0)::numeric as average_matched_rate,
        COALESCE(AVG(bo.matching_score), 0)::numeric as average_matching_score
    FROM borrower_orders bor
    JOIN batch_orders bo ON bor.id::text = bo.order_id
    WHERE bor.avs_status != 'none'
    GROUP BY bor.borrower
)
SELECT 
    user_address,
    user_type,
    total_batches_participated,
    total_orders_submitted,
    fully_matched_orders,
    total_matched_volume,
    average_matched_rate,
    average_matching_score,
    CASE 
        WHEN total_orders_submitted > 0 
        THEN fully_matched_orders::float / total_orders_submitted::float 
        ELSE 0 
    END as match_success_rate
FROM user_stats;

-- View: market_depth
-- Purpose: Shows market depth at different rate levels for UI visualization
CREATE OR REPLACE VIEW market_depth AS
WITH rate_buckets AS (
    SELECT generate_series(0, 2000, 50) as rate_bips
),
lender_depth AS (
    SELECT 
        rb.rate_bips,
        COALESCE(SUM(so.loan_amount - COALESCE(so.matched_amount, 0)), 0)::numeric as lender_volume
    FROM rate_buckets rb
    LEFT JOIN signed_orders so ON so.interest_rate_bips <= rb.rate_bips
        AND so.status = 'active'
        AND (so.avs_status IN ('none', 'submitted', 'pending_match') OR so.is_fully_matched = false)
    GROUP BY rb.rate_bips
),
borrower_depth AS (
    SELECT 
        rb.rate_bips,
        COALESCE(SUM(bo.principal_amount - COALESCE(bo.matched_amount, 0)), 0)::numeric as borrower_volume
    FROM rate_buckets rb
    LEFT JOIN borrower_orders bo ON bo.max_interest_rate_bips >= rb.rate_bips
        AND bo.status = 'active'
        AND (bo.avs_status IN ('none', 'submitted', 'pending_match') OR bo.matched_amount < bo.principal_amount)
    GROUP BY rb.rate_bips
)
SELECT 
    ld.rate_bips,
    ld.lender_volume,
    bd.borrower_volume,
    ld.lender_volume - bd.borrower_volume as net_depth,
    CASE 
        WHEN ld.lender_volume > 0 AND bd.borrower_volume > 0 
        THEN LEAST(ld.lender_volume, bd.borrower_volume) 
        ELSE 0 
    END as matchable_volume
FROM lender_depth ld
JOIN borrower_depth bd ON ld.rate_bips = bd.rate_bips
ORDER BY ld.rate_bips;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_signed_orders_avs_status ON signed_orders(avs_status);
CREATE INDEX IF NOT EXISTS idx_signed_orders_current_batch_id ON signed_orders(current_batch_id);
CREATE INDEX IF NOT EXISTS idx_borrower_orders_avs_status ON borrower_orders(avs_status);
CREATE INDEX IF NOT EXISTS idx_borrower_orders_current_batch_id ON borrower_orders(current_batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_orders_batch_id ON batch_orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_orders_order_id ON batch_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_batch_orders_order_type ON batch_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);
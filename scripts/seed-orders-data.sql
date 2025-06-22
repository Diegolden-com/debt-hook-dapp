-- Seed initial order book data
INSERT INTO orders (type, rate, amount, term, lender, max_ltv, status) VALUES
-- 30-day term bids (lenders)
('bid', 8.2, 5000, 30, '0x1234567890123456789012345678901234567890', 75, 'active'),
('bid', 8.5, 10000, 30, '0x9876543210987654321098765432109876543210', 75, 'active'),
('bid', 8.8, 7500, 30, '0x5555555555555555555555555555555555555555', 80, 'active'),
('bid', 9.1, 12000, 30, '0x7777777777777777777777777777777777777777', 75, 'active'),
('bid', 9.5, 8000, 30, '0x2222222222222222222222222222222222222222', 70, 'active'),

-- 30-day term asks (borrowers)
('ask', 10.2, 3000, 30, null, null, 'active'),
('ask', 9.8, 6000, 30, null, null, 'active'),
('ask', 9.5, 4500, 30, null, null, 'active'),

-- 90-day term bids
('bid', 11.5, 15000, 90, '0x1111111111111111111111111111111111111111', 75, 'active'),
('bid', 12.0, 20000, 90, '0x3333333333333333333333333333333333333333', 80, 'active'),
('bid', 12.5, 10000, 90, '0x5555666655556666555566665555666655556666', 75, 'active'),

-- 90-day term asks
('ask', 13.2, 8000, 90, null, null, 'active'),
('ask', 12.8, 12000, 90, null, null, 'active'),

-- 180-day term bids
('bid', 14.8, 25000, 180, '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 70, 'active'),
('bid', 15.2, 18000, 180, '0xdddddddddddddddddddddddddddddddddddddddd', 75, 'active'),
('bid', 15.8, 22000, 180, '0xffffffffffffffffffffffffffffffffffffffff', 80, 'active'),

-- 180-day term asks
('ask', 16.5, 15000, 180, null, null, 'active'),
('ask', 16.1, 9000, 180, null, null, 'active');

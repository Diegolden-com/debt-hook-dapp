-- Seed initial order book data with more realistic distribution
-- Note: In a lending market:
-- - Lenders create "ask" orders (offering to lend at a certain rate)
-- - Borrowers create "bid" orders (wanting to borrow at a certain rate)

INSERT INTO orders (type, rate, amount, term, lender, borrower, max_ltv, status) VALUES
-- 30-day term lending offers (asks from lenders)
('ask', 7.5, 5000, 30, '0x1234567890123456789012345678901234567890', null, 75, 'active'),
('ask', 7.8, 10000, 30, '0x9876543210987654321098765432109876543210', null, 75, 'active'),
('ask', 8.0, 7500, 30, '0x5555555555555555555555555555555555555555', null, 80, 'active'),
('ask', 8.2, 12000, 30, '0x7777777777777777777777777777777777777777', null, 75, 'active'),
('ask', 8.5, 8000, 30, '0x2222222222222222222222222222222222222222', null, 70, 'active'),
('ask', 8.8, 15000, 30, '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', null, 80, 'active'),
('ask', 9.0, 6000, 30, '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', null, 75, 'active'),

-- 30-day term borrowing requests (bids from borrowers)
('bid', 7.0, 3000, 30, null, '0x3333333333333333333333333333333333333333', null, 'active'),
('bid', 7.2, 6000, 30, null, '0x4444444444444444444444444444444444444444', null, 'active'),
('bid', 7.5, 4500, 30, null, '0x6666666666666666666666666666666666666666', null, 'active'),
('bid', 7.8, 8000, 30, null, '0x8888888888888888888888888888888888888888', null, 'active'),

-- 90-day term lending offers
('ask', 10.5, 15000, 90, '0x1111111111111111111111111111111111111111', null, 75, 'active'),
('ask', 11.0, 20000, 90, '0x3333333333333333333333333333333333333333', null, 80, 'active'),
('ask', 11.5, 10000, 90, '0x5555666655556666555566665555666655556666', null, 75, 'active'),
('ask', 12.0, 25000, 90, '0xcccccccccccccccccccccccccccccccccccccccc', null, 70, 'active'),
('ask', 12.5, 18000, 90, '0xdddddddddddddddddddddddddddddddddddddddd', null, 75, 'active'),

-- 90-day term borrowing requests
('bid', 10.0, 8000, 90, null, '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', null, 'active'),
('bid', 10.5, 12000, 90, null, '0xffffffffffffffffffffffffffffffffffffffff', null, 'active'),
('bid', 11.0, 15000, 90, null, '0x0123456789012345678901234567890123456789', null, 'active'),

-- 180-day term lending offers
('ask', 14.0, 25000, 180, '0xaabbccddaabbccddaabbccddaabbccddaabbccdd', null, 70, 'active'),
('ask', 14.5, 18000, 180, '0x1122334411223344112233441122334411223344', null, 75, 'active'),
('ask', 15.0, 22000, 180, '0x5566778855667788556677885566778855667788', null, 80, 'active'),
('ask', 15.5, 30000, 180, '0x99aabbcc99aabbcc99aabbcc99aabbcc99aabbcc', null, 75, 'active'),

-- 180-day term borrowing requests
('bid', 13.5, 15000, 180, null, '0xffeeddccffeeddccffeeddccffeeddccffeeddcc', null, 'active'),
('bid', 14.0, 9000, 180, null, '0xaaffbbeeaaffbbeeaaffbbeeaaffbbeeaaffbbee', null, 'active'),
('bid', 14.5, 20000, 180, null, '0x1234567890abcdef1234567890abcdef12345678', null, 'active');

-- Add some filled orders for historical data
INSERT INTO orders (type, rate, amount, term, lender, borrower, max_ltv, status) VALUES
('ask', 7.6, 5000, 30, '0x1234567890123456789012345678901234567890', '0x3333333333333333333333333333333333333333', 75, 'filled'),
('ask', 11.2, 10000, 90, '0x1111111111111111111111111111111111111111', '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', 75, 'filled'),
('ask', 14.8, 15000, 180, '0xaabbccddaabbccddaabbccddaabbccddaabbccdd', '0xffeeddccffeeddccffeeddccffeeddccffeeddcc', 70, 'filled');
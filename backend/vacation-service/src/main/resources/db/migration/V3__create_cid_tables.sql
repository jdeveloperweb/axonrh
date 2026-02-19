-- Migration for CID-10 Tables
CREATE TABLE cid_codes (
    code VARCHAR(20) PRIMARY KEY,
    description TEXT,
    chapter_num INTEGER,
    group_code VARCHAR(20),
    category_code VARCHAR(20),
    type VARCHAR(30)
);

CREATE INDEX idx_cid_codes_search ON cid_codes(code, description);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    encrypted_email TEXT,
    encrypted_phone TEXT,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    merchant VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, SUSPICIOUS, FRAUD
    fraud_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data for Metrics
-- INSERT INTO users (username, password_hash, role) VALUES ('admin', 'hashed_pass', 'ADMIN');

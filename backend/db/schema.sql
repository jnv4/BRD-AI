-- BRD AI Database Schema
-- Run this SQL in your PostgreSQL database to create all required tables

-- Drop existing tables if you need a fresh start (comment out in production!)
-- DROP TABLE IF EXISTS alerts CASCADE;
-- DROP TABLE IF EXISTS brd_logs CASCADE;
-- DROP TABLE IF EXISTS brds CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLE 1: USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Business', 'Project Manager', 'Team Lead', 'CTO', 'Admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 2: BRDS (Business Requirements Documents)
-- =====================================================
CREATE TABLE IF NOT EXISTS brds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(500) NOT NULL,
    prepared_by VARCHAR(255) NOT NULL,
    date VARCHAR(50) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'Draft', 
        'Pending Verification', 
        'Verified', 
        'Business Review', 
        'Lead & PM Review', 
        'CTO Approval', 
        'Approved', 
        'Rejected'
    )),
    -- Store complex nested content as JSONB for flexibility
    content JSONB NOT NULL DEFAULT '{}',
    rejection_comment TEXT,
    -- Audit data from AI verification
    audit JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_history JSONB DEFAULT '[]',
    -- Logs stored as JSONB array
    logs JSONB DEFAULT '[]',
    -- Approval tracking
    approvals_yes INTEGER DEFAULT 0,
    approvals_no INTEGER DEFAULT 0,
    final_decision VARCHAR(20) DEFAULT 'pending' CHECK (final_decision IN ('pending', 'approved', 'rejected')),
    -- Timestamps
    last_modified BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 3: ALERTS (Notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'error', 'info')),
    is_read BOOLEAN DEFAULT FALSE,
    -- Related BRD (optional, for tracking which BRD triggered the alert)
    brd_id UUID REFERENCES brds(id) ON DELETE SET NULL,
    -- Alert metadata
    action_type VARCHAR(100), -- e.g., 'BRD_CREATED', 'STATUS_CHANGE', 'APPROVAL', 'REJECTION'
    action_by VARCHAR(255),   -- Who triggered this alert
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_brds_status ON brds(status);
CREATE INDEX IF NOT EXISTS idx_brds_final_decision ON brds(final_decision);
CREATE INDEX IF NOT EXISTS idx_brds_last_modified ON brds(last_modified DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- DEFAULT ADMIN USER (password: admin123)
-- Password is hashed with bcrypt - you should change this!
-- =====================================================
INSERT INTO users (name, email, password, role) VALUES
    ('Shreya Tivrekar', 'pm@brd.com', '$2a$10$rQZKx8RlI8XkPR5v3vz5SeZxOQhVPQoVJGzJqh9F9.l7cKHxjHGiy', 'Project Manager'),
    ('Admin User', 'admin@brd.com', '$2a$10$rQZKx8RlI8XkPR5v3vz5SeZxOQhVPQoVJGzJqh9F9.l7cKHxjHGiy', 'Admin'),
    ('Business Owner', 'business@brd.com', '$2a$10$rQZKx8RlI8XkPR5v3vz5SeZxOQhVPQoVJGzJqh9F9.l7cKHxjHGiy', 'Business'),
    ('CTO Executive', 'cto@brd.com', '$2a$10$rQZKx8RlI8XkPR5v3vz5SeZxOQhVPQoVJGzJqh9F9.l7cKHxjHGiy', 'CTO'),
    ('Engineering Lead', 'lead@brd.com', '$2a$10$rQZKx8RlI8XkPR5v3vz5SeZxOQhVPQoVJGzJqh9F9.l7cKHxjHGiy', 'Team Lead')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brds_updated_at ON brds;
CREATE TRIGGER update_brds_updated_at
    BEFORE UPDATE ON brds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

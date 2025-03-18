-- Create users table.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    profile_image_url VARCHAR(512),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create gpus table.
CREATE TABLE gpus (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) NOT NULL UNIQUE,
    url VARCHAR(512) NOT NULL,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    msrp DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gpu_availability table.
CREATE TABLE gpu_availability (
    id SERIAL PRIMARY KEY,
    gpu_id INTEGER REFERENCES gpus(id) ON DELETE CASCADE,
    province VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10, 2),
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (gpu_id, province, location)
);

-- Create user_tracked_gpus table (junction table).
CREATE TABLE user_tracked_gpus (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    gpu_id INTEGER REFERENCES gpus(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, gpu_id)
);

-- Create user_gpu_watchlists table.
CREATE TABLE user_gpu_watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    gpu_id INTEGER REFERENCES gpus(id) ON DELETE CASCADE,
    price_threshold DECIMAL(10, 2),
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, gpu_id)
);

-- Create scrape_jobs table.
CREATE TABLE scrape_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    gpus_updated INTEGER DEFAULT 0,
    error_message VARCHAR(512),
    new_column BIGINT
);

-- Add some indexes for performance.
CREATE INDEX idx_gpu_availability_gpu_id ON gpu_availability(gpu_id);
CREATE INDEX idx_user_tracked_gpus_user_id ON user_tracked_gpus(user_id);
CREATE INDEX idx_user_tracked_gpus_gpu_id ON user_tracked_gpus(gpu_id);
CREATE INDEX idx_user_gpu_watchlists_user_id ON user_gpu_watchlists(user_id);
CREATE INDEX idx_user_gpu_watchlists_gpu_id ON user_gpu_watchlists(gpu_id);
CREATE INDEX idx_scrape_jobs_user_id ON scrape_jobs(user_id);
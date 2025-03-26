-- Create users table.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    profile_image_url VARCHAR(512),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fixed: removed comma and added default value
);

-- Create gpus table.
CREATE TABLE gpus (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) NOT NULL UNIQUE,
    url VARCHAR(512) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    msrp DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fixed: removed comma and added default value
);

-- Create gpu_availability table.
CREATE TABLE gpu_availability (
    id SERIAL PRIMARY KEY,
    gpu_id INTEGER REFERENCES gpus(id) ON DELETE CASCADE,
    province VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    UNIQUE (gpu_id, province, location),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fixed: removed comma and added default value
);

CREATE TABLE user_gpu_relationships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    gpu_id INTEGER REFERENCES gpus(id) ON DELETE CASCADE,
    is_tracking BOOLEAN DEFAULT TRUE,
    price_threshold DECIMAL(10, 2) NULL,
    notification_enabled BOOLEAN DEFAULT FALSE,
    UNIQUE (user_id, gpu_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Fixed: removed comma and added default value
);

-- Create scrape_jobs table.
CREATE TABLE scrape_jobs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    gpus_updated INTEGER DEFAULT 0,
    error_message VARCHAR(512),
    new_column BIGINT
);
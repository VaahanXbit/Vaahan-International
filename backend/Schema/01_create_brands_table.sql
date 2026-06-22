-- ================================================================================
-- File Name : 01_create_brands_table.sql
-- Author : Tahseen Raza
-- Created Date : 2026-06-22
-- Description : Brands table for car manufacturers
-- Company : Vaahan International
-- Copyright : (c) 2026 Vaahan International. All rights reserved.
-- ================================================================================

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS brands CASCADE;

-- Create brands table
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo VARCHAR(500),
    country VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE brands IS 'Stores car manufacturer/brand information';
COMMENT ON COLUMN brands.id IS 'Unique identifier for the brand';
COMMENT ON COLUMN brands.name IS 'Brand name (e.g., Hyundai, Tata)';
COMMENT ON COLUMN brands.slug IS 'URL-friendly version of brand name';
COMMENT ON COLUMN brands.logo IS 'URL path to brand logo image';
COMMENT ON COLUMN brands.country IS 'Country of origin for the brand';
COMMENT ON COLUMN brands.description IS 'Brand description';

-- Create indexes for performance
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_slug ON brands(slug);

-- Sample data
INSERT INTO brands (name, slug, logo, country, description) VALUES
('Hyundai', 'hyundai', '/images/logos/hyundai.png', 'South Korea', 'Hyundai Motor Company is a South Korean multinational automotive manufacturer.'),
('Kia', 'kia', '/images/logos/kia.png', 'South Korea', 'Kia Corporation is a South Korean multinational automobile manufacturer.'),
('Tata', 'tata', '/images/logos/tata.png', 'India', 'Tata Motors is an Indian multinational automotive manufacturing company.'),
('Mahindra', 'mahindra', '/images/logos/mahindra.png', 'India', 'Mahindra & Mahindra is an Indian multinational automotive manufacturing corporation.'),
('Suzuki', 'suzuki', '/images/logos/suzuki.png', 'Japan', 'Suzuki Motor Corporation is a Japanese multinational mobility manufacturer.');
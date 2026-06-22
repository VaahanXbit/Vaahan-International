-- ================================================================================
-- File Name : 05_insert_sample_data.sql
-- Author : Tahseen Raza
-- Created Date : 2026-06-22
-- Description : Sample data insertion for testing
-- Company : Vaahan International
-- Copyright : (c) 2026 Vaahan International. All rights reserved.
-- ================================================================================

-- Insert sample articles
INSERT INTO articles (title, slug, category, sub_category, excerpt, content, image, author, date, read_time, tags, status) VALUES
(
    'AWD vs FWD: The ₹2 Lakh Question Nobody Answers Honestly',
    'awd-vs-fwd',
    'Feature Reviews',
    'Drivetrain Comparison',
    'A practical comparison between AWD and FWD systems for Indian roads.',
    '<h2>The Story</h2><p>My friend paid ₹2 lakhs extra for AWD on his Fortuner...</p>',
    '/images/awd-vs-fwd.jpg',
    'Tahseen Raza',
    'January 15, 2025',
    '8 min read',
    ARRAY['AWD', 'FWD', 'Drivetrain', 'Comparison'],
    'published'
),
(
    'What is ADAS? Complete Guide',
    'what-is-adas',
    'Tech Insights',
    'ADAS',
    'Advanced Driver Assistance Systems explained simply.',
    '<h2>What is ADAS?</h2><p>ADAS stands for Advanced Driver Assistance Systems...</p>',
    '/images/adas-guide.jpg',
    'Vaahan Team',
    'January 10, 2025',
    '6 min read',
    ARRAY['ADAS', 'Safety', 'Guide'],
    'published'
);

-- Insert sample brand
INSERT INTO brands (name, slug, logo, country, description) VALUES
('Hyundai', 'hyundai', '/images/logos/hyundai.png', 'South Korea', 'Hyundai Motor Company is a South Korean multinational automotive manufacturer.');

-- Insert sample model
INSERT INTO models (brand_id, name, slug, image, body_type, seating_capacity, description) VALUES
(
    (SELECT id FROM brands WHERE name = 'Hyundai'),
    'Creta',
    'hyundai-creta',
    '/images/Hyundai Creta SX(O) 1.5 Diesel AT.png',
    'SUV',
    5,
    'The Hyundai Creta is a compact SUV known for its stylish design and feature-rich interior.'
);

-- Insert sample variant with scores
INSERT INTO variants (
    model_id,
    name,
    price,
    ex_showroom_price,
    fuel_type,
    transmission,
    engine,
    power,
    torque,
    mileage,
    overall_score,
    scores,
    factor_scores
) VALUES (
    (SELECT id FROM models WHERE slug = 'hyundai-creta'),
    'SX(O) 1.5 Diesel AT',
    '₹11,00,000 - ₹19,00,000',
    1500000,
    'Diesel',
    'Automatic',
    '1.5L Turbo Diesel',
    '115 bhp',
    '250 Nm',
    '18.2 km/L',
    8.5,
    '{
        "safetyScore": 8.5,
        "performanceScore": 7.8,
        "drivingExperienceScore": 8.2,
        "suspensionScore": 8.0,
        "comfortScore": 9.0,
        "featuresScore": 9.0,
        "valueForMoneyScore": 8.5,
        "cityDrivingScore": 9.0,
        "highwayDrivingScore": 8.5,
        "familyScore": 9.0,
        "maintenanceScore": 8.0
    }'::jsonb,
    '{
        "safetyScore": {
            "airbags": 9.0,
            "adas": 8.5,
            "ncapRating": 9.0,
            "braking": 8.0,
            "structuralSafety": 8.0
        },
        "performanceScore": {
            "enginePower": 8.0,
            "torque": 8.0,
            "acceleration": 7.5,
            "highwayPerformance": 8.0,
            "gearboxResponse": 7.5
        }
    }'::jsonb
);
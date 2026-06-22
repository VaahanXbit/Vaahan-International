-- ================================================================================
-- File Name : 06_queries_for_api.sql
-- Author : Tahseen Raza
-- Created Date : 2026-06-22
-- Description : Useful queries for API endpoints
-- Company : Vaahan International
-- Copyright : (c) 2026 Vaahan International. All rights reserved.
-- ================================================================================

-- 1. Get all brands with their models and variants
SELECT 
    b.id as brand_id,
    b.name as brand_name,
    b.slug as brand_slug,
    m.id as model_id,
    m.name as model_name,
    m.slug as model_slug,
    v.id as variant_id,
    v.name as variant_name,
    v.price,
    v.overall_score,
    v.scores
FROM brands b
JOIN models m ON m.brand_id = b.id
JOIN variants v ON v.model_id = m.id
ORDER BY b.name, m.name, v.name;

-- 2. Get top-rated cars
SELECT 
    b.name as brand,
    m.name as model,
    v.name as variant,
    v.overall_score,
    v.price,
    v.scores->>'safetyScore' as safety_score,
    v.scores->>'performanceScore' as performance_score
FROM variants v
JOIN models m ON m.id = v.model_id
JOIN brands b ON b.id = m.brand_id
WHERE v.overall_score >= 8.0
ORDER BY v.overall_score DESC
LIMIT 10;

-- 3. Search articles by keyword
SELECT 
    id,
    title,
    slug,
    category,
    excerpt,
    date,
    read_time,
    ts_rank(
        to_tsvector('english', title || ' ' || excerpt || ' ' || array_to_string(tags, ' ')),
        plainto_tsquery('english', 'ADAS safety')
    ) as relevance
FROM articles
WHERE 
    status = 'published' AND
    to_tsvector('english', title || ' ' || excerpt || ' ' || array_to_string(tags, ' ')) @@ 
    plainto_tsquery('english', 'ADAS safety')
ORDER BY relevance DESC;

-- 4. Compare two cars
WITH car1 AS (
    SELECT 
        b.name as brand,
        m.name as model,
        v.name as variant,
        v.overall_score,
        v.scores,
        v.factor_scores
    FROM variants v
    JOIN models m ON m.id = v.model_id
    JOIN brands b ON b.id = m.brand_id
    WHERE v.id = 1
),
car2 AS (
    SELECT 
        b.name as brand,
        m.name as model,
        v.name as variant,
        v.overall_score,
        v.scores,
        v.factor_scores
    FROM variants v
    JOIN models m ON m.id = v.model_id
    JOIN brands b ON b.id = m.brand_id
    WHERE v.id = 2
)
SELECT 
    'Car 1' as car_number,
    brand,
    model,
    variant,
    overall_score,
    scores
FROM car1
UNION ALL
SELECT 
    'Car 2' as car_number,
    brand,
    model,
    variant,
    overall_score,
    scores
FROM car2;

-- 5. Get articles by category with pagination
SELECT 
    id,
    title,
    slug,
    excerpt,
    image,
    author,
    date,
    read_time,
    tags
FROM articles
WHERE 
    category = 'Feature Reviews' AND
    status = 'published'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- 6. Get variants by brand and model
SELECT 
    v.*,
    jsonb_build_object(
        'brand', b.name,
        'model', m.name
    ) as brand_model
FROM variants v
JOIN models m ON m.id = v.model_id
JOIN brands b ON b.id = m.brand_id
WHERE 
    b.slug = 'hyundai' AND 
    m.slug = 'hyundai-creta';

-- 7. Get latest articles with author and category
SELECT 
    id,
    title,
    slug,
    category,
    excerpt,
    image,
    author,
    date,
    read_time,
    tags
FROM articles
WHERE status = 'published'
ORDER BY published_at DESC NULLS LAST, created_at DESC
LIMIT 6;
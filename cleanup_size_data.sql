-- Cleanup script to remove size chart data for products without size_chart_template_id
-- This ensures products like bags that don't need sizes have no size-related data

-- Step 1: Find products without size_chart_template_id that have size data
-- Step 2: Remove product_sizes entries for these products
-- Step 3: Remove product_size_stock entries for these products

-- Remove product_size_stock for products without size_chart_template_id
DELETE FROM public.product_size_stock
WHERE product_size_id IN (
    SELECT ps.id
    FROM public.product_sizes ps
    INNER JOIN public.products p ON ps.product_id = p.id
    WHERE p.size_chart_template_id IS NULL
);

-- Remove product_sizes entries for products without size_chart_template_id
DELETE FROM public.product_sizes
WHERE product_id IN (
    SELECT id
    FROM public.products
    WHERE size_chart_template_id IS NULL
);

-- Verify cleanup
-- This query should return 0 rows if cleanup was successful
SELECT 
    p.id,
    p.name,
    p.size_chart_template_id,
    COUNT(ps.id) as size_count
FROM public.products p
LEFT JOIN public.product_sizes ps ON p.id = ps.product_id
WHERE p.size_chart_template_id IS NULL
GROUP BY p.id, p.name, p.size_chart_template_id
HAVING COUNT(ps.id) > 0;



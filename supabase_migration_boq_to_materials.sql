-- ============================================
-- TAHAP 2: MIGRASI DATA BOQ KE MATERIALS
-- ============================================
-- SAFE: Hanya INSERT/UPDATE, tidak DELETE
-- Bisa dijalankan berkali-kali (idempotent)

DO $$
DECLARE
    item_record RECORD;
    mat_id UUID;
    migrated_count INT := 0;
    skipped_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting migration from project_items to materials...';
    
    FOR item_record IN 
        SELECT DISTINCT ON (item_code, project_id)
            project_id,
            item_code,
            description,
            unit,
            quantity,
            unit_price,
            unit_price_mandor,
            created_at
        FROM project_items
        WHERE item_code IS NOT NULL 
        AND item_code != ''
        ORDER BY item_code, project_id, created_at DESC
    LOOP
        BEGIN
            -- 1. Upsert material (master data)
            INSERT INTO materials (name, description, unit, khs_item_code)
            VALUES (
                item_record.item_code,
                item_record.description,
                item_record.unit,
                item_record.item_code
            )
            ON CONFLICT (name) DO UPDATE 
            SET 
                description = COALESCE(EXCLUDED.description, materials.description),
                unit = COALESCE(EXCLUDED.unit, materials.unit),
                khs_item_code = COALESCE(EXCLUDED.khs_item_code, materials.khs_item_code)
            RETURNING id INTO mat_id;
            
            -- 2. Upsert requirement dengan harga (per project)
            INSERT INTO project_material_requirements (
                project_id,
                material_id,
                quantity_needed,
                unit_price_vendor,
                unit_price_mandor,
                item_code,
                description,
                distribution_name
            )
            VALUES (
                item_record.project_id,
                mat_id,
                item_record.quantity,
                COALESCE(item_record.unit_price, 0),
                COALESCE(item_record.unit_price_mandor, 0),
                item_record.item_code,
                item_record.description,
                '' -- default empty distribution
            )
            ON CONFLICT (project_id, material_id, distribution_name) 
            DO UPDATE SET
                quantity_needed = GREATEST(
                    EXCLUDED.quantity_needed, 
                    project_material_requirements.quantity_needed
                ),
                unit_price_vendor = COALESCE(
                    NULLIF(EXCLUDED.unit_price_vendor, 0), 
                    project_material_requirements.unit_price_vendor
                ),
                unit_price_mandor = COALESCE(
                    NULLIF(EXCLUDED.unit_price_mandor, 0), 
                    project_material_requirements.unit_price_mandor
                ),
                item_code = COALESCE(EXCLUDED.item_code, project_material_requirements.item_code),
                description = COALESCE(EXCLUDED.description, project_material_requirements.description);
            
            migrated_count := migrated_count + 1;
            
            -- Log progress setiap 100 items
            IF migrated_count % 100 = 0 THEN
                RAISE NOTICE 'Migrated % items...', migrated_count;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            skipped_count := skipped_count + 1;
            RAISE NOTICE 'Skipped item % (project %): %', 
                item_record.item_code, 
                item_record.project_id, 
                SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed!';
    RAISE NOTICE 'Successfully migrated: % items', migrated_count;
    RAISE NOTICE 'Skipped (errors): % items', skipped_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- 1. Count total materials created
SELECT COUNT(*) as total_materials_with_khs_code
FROM materials
WHERE khs_item_code IS NOT NULL;

-- 2. Count requirements with prices
SELECT 
    COUNT(*) as total_requirements,
    COUNT(CASE WHEN unit_price_vendor > 0 THEN 1 END) as with_vendor_price,
    COUNT(CASE WHEN unit_price_mandor > 0 THEN 1 END) as with_mandor_price,
    SUM(total_value_vendor) as total_vendor_value,
    SUM(total_value_mandor) as total_mandor_value
FROM project_material_requirements;

-- 3. Compare totals (should match)
SELECT 
    'project_items (OLD)' as source,
    COUNT(*) as total_items,
    ROUND(SUM(unit_price * quantity)::numeric, 2) as total_vendor_value,
    ROUND(SUM(unit_price_mandor * COALESCE(quantity_mandor, quantity))::numeric, 2) as total_mandor_value
FROM project_items

UNION ALL

SELECT 
    'requirements (NEW)' as source,
    COUNT(*) as total_items,
    ROUND(SUM(total_value_vendor)::numeric, 2) as total_vendor_value,
    ROUND(SUM(total_value_mandor)::numeric, 2) as total_mandor_value
FROM project_material_requirements
WHERE unit_price_vendor > 0 OR unit_price_mandor > 0;

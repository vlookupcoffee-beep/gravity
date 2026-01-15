-- Add category column to daily_report_items
ALTER TABLE daily_report_items 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'SOW';

-- Update existing rows to have category 'SOW' (though default handles new ones, old ones might be null if not careful, but add column with default usually backfills or handled)
UPDATE daily_report_items SET category = 'SOW' WHERE category IS NULL;

-- Create index for performance if we filter by category often
CREATE INDEX IF NOT EXISTS idx_daily_report_items_category ON daily_report_items(category);

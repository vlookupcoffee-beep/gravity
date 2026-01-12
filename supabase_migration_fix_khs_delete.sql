-- Fix foreign key constraint to allow deleting KHS items
-- Using ON DELETE SET NULL because project_items already snapshots the data (code, description, price)
-- so the history is preserved even if the original KHS item is deleted.

ALTER TABLE project_items
DROP CONSTRAINT IF EXISTS project_items_khs_item_id_fkey;

ALTER TABLE project_items
ADD CONSTRAINT project_items_khs_item_id_fkey 
FOREIGN KEY (khs_item_id) 
REFERENCES khs_items(id) 
ON DELETE SET NULL;

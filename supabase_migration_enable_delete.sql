-- Enable delete for authenticated users on materials
CREATE POLICY "Enable delete for authenticated users"
ON materials
FOR DELETE
USING (auth.role() = 'authenticated');

-- Enable delete for authenticated users on material_transactions
CREATE POLICY "Enable delete for authenticated users"
ON material_transactions
FOR DELETE
USING (auth.role() = 'authenticated');

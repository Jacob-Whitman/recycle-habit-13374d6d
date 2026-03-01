-- Add plastic resin code types (#1–#7) for the Log page
INSERT INTO public.item_types (id, name, category, icon, default_prep_steps, default_bin_double_stream) VALUES
  ('plastic_1', '#1 PET (PETE)', 'container', '🧴', ARRAY['Empty and rinse', 'Replace cap', 'Remove labels if easy'], 'containers'),
  ('plastic_2', '#2 HDPE', 'container', '🧴', ARRAY['Empty and rinse', 'Replace cap', 'Flatten if possible'], 'containers'),
  ('plastic_3', '#3 PVC', 'container', '🧴', ARRAY['Empty and rinse', 'Check local acceptance'], 'containers'),
  ('plastic_4', '#4 LDPE', 'container', '🛍️', ARRAY['Often store drop-off only', 'Keep clean and dry'], 'special'),
  ('plastic_5', '#5 PP', 'container', '🧴', ARRAY['Empty and rinse', 'Widely accepted'], 'containers'),
  ('plastic_6', '#6 PS', 'container', '🧴', ARRAY['Empty and rinse', 'Check local acceptance'], 'containers'),
  ('plastic_7', '#7 Other', 'container', '🧴', ARRAY['Check local acceptance', 'May not be accepted curbside'], 'containers')
ON CONFLICT (id) DO NOTHING;

-- Undo: remove plastic resin code types (#1–#7) added by 20260228180000_plastic_resin_types.sql
-- Remove dependent rows first (FK from user_item_rules and log_entries)
DELETE FROM public.user_item_rules
WHERE item_type_id IN ('plastic_1', 'plastic_2', 'plastic_3', 'plastic_4', 'plastic_5', 'plastic_6', 'plastic_7');

DELETE FROM public.log_entries
WHERE item_type_id IN ('plastic_1', 'plastic_2', 'plastic_3', 'plastic_4', 'plastic_5', 'plastic_6', 'plastic_7');

DELETE FROM public.item_types
WHERE id IN ('plastic_1', 'plastic_2', 'plastic_3', 'plastic_4', 'plastic_5', 'plastic_6', 'plastic_7');

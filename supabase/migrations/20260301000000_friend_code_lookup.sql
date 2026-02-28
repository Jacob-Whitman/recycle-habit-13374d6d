-- Allow authenticated users to resolve a friend code to user_id (for "Add friend" flow).
-- RLS on profiles blocks reading other users' rows; this function returns only user_id.
CREATE OR REPLACE FUNCTION public.get_user_id_by_friend_code(code TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT user_id FROM public.profiles WHERE friend_code = code LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_by_friend_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_friend_code(TEXT) TO service_role;

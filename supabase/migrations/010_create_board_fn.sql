-- Migration: 010_create_board_fn.sql
-- SECURITY DEFINER function to create a board + auto-insert owner as board member.
-- Called via supabase.rpc('create_board', { p_name }) from API routes.
-- auth.uid() is still set by PostgREST from the request JWT, but RLS is bypassed
-- because the function runs as its definer (postgres superuser).

CREATE OR REPLACE FUNCTION public.create_board(p_name text)
RETURNS public.boards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board public.boards;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.boards (name, owner_id)
  VALUES (p_name, auth.uid())
  RETURNING * INTO v_board;

  -- owner row is also added by the on_board_created trigger,
  -- but belt-and-suspenders here guarantees it even if trigger is missing
  INSERT INTO public.board_members (board_id, user_id, role)
  VALUES (v_board.id, auth.uid(), 'owner')
  ON CONFLICT (board_id, user_id) DO NOTHING;

  RETURN v_board;
END;
$$;

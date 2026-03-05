-- Migration: 009_board_owner_trigger.sql
-- Auto-insert the board creator as owner in board_members when a new board is created.
-- This resolves the RLS chicken-and-egg: columns/board_members inserts require
-- is_board_member(), but the owner row doesn't exist yet at INSERT time.

CREATE OR REPLACE FUNCTION public.handle_new_board()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.board_members (board_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (board_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_board_created
  AFTER INSERT ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_board();

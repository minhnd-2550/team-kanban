-- Migration: 007_rls.sql
-- Row Level Security policies for all tables

-- ─── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: is the current user a member of the given board? ────────
CREATE OR REPLACE FUNCTION public.is_board_member(p_board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id
      AND user_id = auth.uid()
  );
$$;

-- ─── Helper function: is the current user the owner of the given board? ───────
CREATE OR REPLACE FUNCTION public.is_board_owner(p_board_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id
      AND user_id = auth.uid()
      AND role = 'owner'
  );
$$;

-- ─── profiles ────────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.board_members bm1
      JOIN public.board_members bm2 ON bm1.board_id = bm2.board_id
      WHERE bm1.user_id = auth.uid()
        AND bm2.user_id = profiles.id
    )
  );

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ─── boards ──────────────────────────────────────────────────────────────────
CREATE POLICY "boards_select" ON public.boards
  FOR SELECT USING (public.is_board_member(id));

CREATE POLICY "boards_insert" ON public.boards
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "boards_update" ON public.boards
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "boards_delete" ON public.boards
  FOR DELETE USING (auth.uid() = owner_id);

-- ─── board_members ────────────────────────────────────────────────────────────
CREATE POLICY "board_members_select" ON public.board_members
  FOR SELECT USING (public.is_board_member(board_id));

-- Only board owners can invite new members
CREATE POLICY "board_members_insert" ON public.board_members
  FOR INSERT WITH CHECK (public.is_board_owner(board_id));

-- Only board owners can remove others; members can remove themselves
CREATE POLICY "board_members_delete" ON public.board_members
  FOR DELETE USING (
    public.is_board_owner(board_id) OR user_id = auth.uid()
  );

-- ─── columns ─────────────────────────────────────────────────────────────────
CREATE POLICY "columns_select" ON public.columns
  FOR SELECT USING (public.is_board_member(board_id));

CREATE POLICY "columns_insert" ON public.columns
  FOR INSERT WITH CHECK (public.is_board_member(board_id));

CREATE POLICY "columns_update" ON public.columns
  FOR UPDATE USING (public.is_board_member(board_id));

CREATE POLICY "columns_delete" ON public.columns
  FOR DELETE USING (public.is_board_member(board_id));

-- ─── cards ───────────────────────────────────────────────────────────────────
CREATE POLICY "cards_select" ON public.cards
  FOR SELECT USING (public.is_board_member(board_id));

CREATE POLICY "cards_insert" ON public.cards
  FOR INSERT WITH CHECK (public.is_board_member(board_id));

CREATE POLICY "cards_update" ON public.cards
  FOR UPDATE USING (public.is_board_member(board_id));

-- Only the creator or board owner can delete a card
CREATE POLICY "cards_delete" ON public.cards
  FOR DELETE USING (
    created_by = auth.uid() OR public.is_board_owner(board_id)
  );

-- ─── comments ────────────────────────────────────────────────────────────────
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT USING (public.is_board_member(board_id));

CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT WITH CHECK (public.is_board_member(board_id) AND author_id = auth.uid());

-- Only the author or board owner can delete a comment
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE USING (
    author_id = auth.uid() OR public.is_board_owner(board_id)
  );

-- ─── activity_events ─────────────────────────────────────────────────────────
-- Board members can read; no direct insert/update/delete from clients (triggers only)
CREATE POLICY "activity_select" ON public.activity_events
  FOR SELECT USING (public.is_board_member(board_id));

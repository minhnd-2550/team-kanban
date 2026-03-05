-- Migration: 004_comments.sql
-- Creates comments table

CREATE TABLE public.comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  board_id   uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,  -- denormalised for RLS
  author_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.comments IS 'Plain-text comments posted on cards. Immutable after creation (v1).';

-- Migration: 003_columns_cards.sql
-- Creates columns and cards tables

CREATE TABLE public.columns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 50),
  position   integer NOT NULL CHECK (position >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_column_position UNIQUE (board_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE public.cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id   uuid NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
  board_id    uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,  -- denormalised for RLS / Realtime
  title       text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 255),
  description text CHECK (description IS NULL OR char_length(description) <= 5000),
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  position    integer NOT NULL CHECK (position >= 0),
  created_by  uuid NOT NULL REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

COMMENT ON TABLE public.columns IS 'Ordered lanes within a board (e.g. To Do, In Progress, Done).';
COMMENT ON TABLE public.cards   IS 'Task cards that live within a column.';

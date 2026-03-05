-- Migration: 002_boards.sql
-- Creates boards and board_members tables

-- Enable moddatetime extension for auto-updating updated_at columns
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TABLE public.boards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  owner_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TABLE public.board_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id  uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role      text NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_board_member UNIQUE (board_id, user_id)
);

COMMENT ON TABLE public.boards IS 'Kanban boards owned by a user.';
COMMENT ON TABLE public.board_members IS 'Team members with access to a board.';

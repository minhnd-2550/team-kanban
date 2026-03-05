-- Migration: 006_indexes.sql
-- Performance indexes per data-model.md

-- Board membership lookups
CREATE INDEX idx_board_members_user  ON public.board_members(user_id);
CREATE INDEX idx_board_members_board ON public.board_members(board_id);

-- Column ordering within a board
CREATE INDEX idx_columns_board_pos   ON public.columns(board_id, position);

-- Card ordering within a column
CREATE INDEX idx_cards_column_pos    ON public.cards(column_id, position);

-- Card lookup by board (RLS + Realtime filter)
CREATE INDEX idx_cards_board         ON public.cards(board_id);

-- Comment chronological listing per card
CREATE INDEX idx_comments_card_time  ON public.comments(card_id, created_at ASC);

-- Activity log per board (descending — most recent first)
CREATE INDEX idx_activity_board_time ON public.activity_events(board_id, created_at DESC);

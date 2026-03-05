-- Migration: 005_activity_events.sql
-- Creates activity_events table and Postgres triggers to populate it automatically

CREATE TABLE public.activity_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id             uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  actor_id             uuid NOT NULL REFERENCES public.profiles(id),
  event_type           text NOT NULL CHECK (event_type IN (
                         'card_created', 'card_moved', 'card_assigned', 'card_unassigned',
                         'card_deleted', 'comment_added', 'member_added', 'member_removed'
                       )),
  card_id              uuid,          -- nullable: reference to card (may be deleted)
  card_title_snapshot  text,          -- captured at event time
  from_column_id       uuid,          -- for card_moved
  to_column_id         uuid,          -- for card_moved
  from_column_name     text,          -- snapshot
  to_column_name       text,          -- snapshot
  meta                 jsonb,
  created_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.activity_events IS 'Append-only audit log; populated by Postgres triggers only.';

-- ─── Trigger: card created ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_card_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (board_id, actor_id, event_type, card_id, card_title_snapshot, to_column_id)
  SELECT NEW.board_id, NEW.created_by, 'card_created', NEW.id, NEW.title, NEW.column_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_card_insert
  AFTER INSERT ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.trg_card_created();

-- ─── Trigger: card moved (column_id changed) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_card_moved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_from_col_name text;
  v_to_col_name   text;
  v_actor_id      uuid;
BEGIN
  IF OLD.column_id = NEW.column_id THEN RETURN NEW; END IF;

  SELECT name INTO v_from_col_name FROM public.columns WHERE id = OLD.column_id;
  SELECT name INTO v_to_col_name   FROM public.columns WHERE id = NEW.column_id;

  -- Use the last signed-in user; fall back to created_by
  v_actor_id := COALESCE(auth.uid(), NEW.created_by);

  INSERT INTO public.activity_events
    (board_id, actor_id, event_type, card_id, card_title_snapshot,
     from_column_id, to_column_id, from_column_name, to_column_name)
  VALUES
    (NEW.board_id, v_actor_id, 'card_moved', NEW.id, NEW.title,
     OLD.column_id, NEW.column_id, v_from_col_name, v_to_col_name);

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_card_move
  AFTER UPDATE OF column_id ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.trg_card_moved();

-- ─── Trigger: card assigned / unassigned ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_card_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor_id uuid;
  v_etype    text;
BEGIN
  IF NEW.assignee_id IS NOT DISTINCT FROM OLD.assignee_id THEN RETURN NEW; END IF;

  v_actor_id := COALESCE(auth.uid(), NEW.created_by);
  v_etype    := CASE WHEN NEW.assignee_id IS NULL THEN 'card_unassigned' ELSE 'card_assigned' END;

  INSERT INTO public.activity_events (board_id, actor_id, event_type, card_id, card_title_snapshot)
  VALUES (NEW.board_id, v_actor_id, v_etype, NEW.id, NEW.title);

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_card_assign
  AFTER UPDATE OF assignee_id ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.trg_card_assigned();

-- ─── Trigger: card deleted ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_card_deleted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (board_id, actor_id, event_type, card_id, card_title_snapshot)
  VALUES (OLD.board_id, COALESCE(auth.uid(), OLD.created_by), 'card_deleted', OLD.id, OLD.title);
  RETURN OLD;
END;
$$;

CREATE TRIGGER after_card_delete
  AFTER DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.trg_card_deleted();

-- ─── Trigger: comment added ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_comment_added()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_card_title text;
BEGIN
  SELECT title INTO v_card_title FROM public.cards WHERE id = NEW.card_id;

  INSERT INTO public.activity_events (board_id, actor_id, event_type, card_id, card_title_snapshot)
  VALUES (NEW.board_id, NEW.author_id, 'comment_added', NEW.card_id, v_card_title);

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.trg_comment_added();

-- ─── Trigger: member added / removed ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_member_added()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (board_id, actor_id, event_type)
  VALUES (NEW.board_id, NEW.user_id, 'member_added');
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_member_insert
  AFTER INSERT ON public.board_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_member_added();

CREATE OR REPLACE FUNCTION public.trg_member_removed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_events (board_id, actor_id, event_type)
  VALUES (OLD.board_id, OLD.user_id, 'member_removed');
  RETURN OLD;
END;
$$;

CREATE TRIGGER after_member_delete
  AFTER DELETE ON public.board_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_member_removed();

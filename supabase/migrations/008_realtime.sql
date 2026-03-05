-- Migration: 008_realtime.sql
-- Enable Supabase Realtime publication on the tables that need live sync

-- Add tables to the supabase_realtime publication
-- (Supabase creates this publication automatically; we just add our tables)
ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;

-- Set replica identity to FULL on cards so DELETE events include OLD row data
-- (needed for the client to know which card was deleted by id)
ALTER TABLE public.cards             REPLICA IDENTITY FULL;
ALTER TABLE public.columns           REPLICA IDENTITY FULL;
ALTER TABLE public.comments          REPLICA IDENTITY FULL;
ALTER TABLE public.activity_events   REPLICA IDENTITY FULL;

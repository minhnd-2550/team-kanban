-- seed.sql — Development seed data
-- Two test users, one board, three columns, five cards

-- ─── Test user UUIDs (deterministic for local dev) ───────────────────────────
DO $$
DECLARE
  v_alice  uuid := '00000000-0000-0000-0000-000000000001';
  v_bob    uuid := '00000000-0000-0000-0000-000000000002';
  v_board  uuid := '10000000-0000-0000-0000-000000000001';
  v_todo   uuid := '20000000-0000-0000-0000-000000000001';
  v_prog   uuid := '20000000-0000-0000-0000-000000000002';
  v_done   uuid := '20000000-0000-0000-0000-000000000003';
BEGIN
  -- Auth users (required before profiles due to FK constraint)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES
    (
      v_alice,
      '00000000-0000-0000-0000-000000000000',
      'alice@example.com',
      crypt('password123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Alice Demo"}'::jsonb,
      'authenticated', 'authenticated'
    ),
    (
      v_bob,
      '00000000-0000-0000-0000-000000000000',
      'bob@example.com',
      crypt('password123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Bob Demo"}'::jsonb,
      'authenticated', 'authenticated'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Profiles (auto-created by trigger, but ensure they exist with correct data)
  INSERT INTO public.profiles (id, display_name, email) VALUES
    (v_alice, 'Alice Demo', 'alice@example.com'),
    (v_bob,   'Bob Demo',   'bob@example.com')
  ON CONFLICT (id) DO NOTHING;

  -- Board
  INSERT INTO public.boards (id, name, owner_id) VALUES
    (v_board, 'Demo Kanban', v_alice)
  ON CONFLICT (id) DO NOTHING;

  -- Board members
  INSERT INTO public.board_members (board_id, user_id, role) VALUES
    (v_board, v_alice, 'owner'),
    (v_board, v_bob,   'member')
  ON CONFLICT (board_id, user_id) DO NOTHING;

  -- Columns
  INSERT INTO public.columns (id, board_id, name, position) VALUES
    (v_todo, v_board, 'To Do',       0),
    (v_prog, v_board, 'In Progress', 1),
    (v_done, v_board, 'Done',        2)
  ON CONFLICT (id) DO NOTHING;

  -- Cards
  INSERT INTO public.cards (board_id, column_id, title, description, created_by, position) VALUES
    (v_board, v_todo, 'Design wireframes',          'Create low-fi mockups for the board view', v_alice, 0),
    (v_board, v_todo, 'Set up CI pipeline',         'Configure GitHub Actions for lint + test',  v_bob,   1),
    (v_board, v_prog, 'Implement drag-and-drop',    'Use @hello-pangea/dnd to move cards',       v_alice, 0),
    (v_board, v_prog, 'Write unit tests',           'Vitest coverage ≥ 80%',                     v_bob,   1),
    (v_board, v_done, 'Bootstrap Next.js project',  'Scaffold with TypeScript + Tailwind',       v_alice, 0)
  ON CONFLICT DO NOTHING;
END $$;

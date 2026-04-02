-- ============================================================
-- Duck Team — Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role      AS ENUM ('admin', 'player', 'guest');
CREATE TYPE skill_level    AS ENUM ('amateur', 'medium', 'pro');
CREATE TYPE game_status    AS ENUM ('open', 'teams_formed', 'completed');
CREATE TYPE transaction_type AS ENUM ('subscription', 'guest_payment', 'expense', 'adjustment');

-- ============================================================
-- TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  avatar_url  TEXT,
  role        user_role NOT NULL DEFAULT 'guest',
  skill_level skill_level NOT NULL DEFAULT 'amateur',
  phone       TEXT,
  push_token  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER: get the role of the current user (defined AFTER profiles)
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- games
CREATE TABLE public.games (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE NOT NULL,
  time        TIME NOT NULL,
  location    TEXT NOT NULL,
  description TEXT,
  status      game_status NOT NULL DEFAULT 'open',
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- game_registrations
CREATE TABLE public.game_registrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_name   TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_player_or_guest CHECK (player_id IS NOT NULL OR guest_name IS NOT NULL),
  UNIQUE (game_id, player_id)
);

-- teams
CREATE TABLE public.teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  team_name   TEXT NOT NULL,
  team_number INT NOT NULL
);

-- team_members
CREATE TABLE public.team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_name TEXT
);

-- transactions
CREATE TABLE public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type        transaction_type NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  game_id     UUID REFERENCES public.games(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- messages
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id    UUID REFERENCES public.games(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invite_codes
CREATE TABLE public.invite_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- notifications
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  type       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_user_id         ON public.profiles(user_id);
CREATE INDEX idx_games_date               ON public.games(date);
CREATE INDEX idx_game_regs_game_id        ON public.game_registrations(game_id);
CREATE INDEX idx_game_regs_player_id      ON public.game_registrations(player_id);
CREATE INDEX idx_transactions_player_id   ON public.transactions(player_id);
CREATE INDEX idx_transactions_created_at  ON public.transactions(created_at);
CREATE INDEX idx_messages_sender_id       ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at      ON public.messages(created_at);
CREATE INDEX idx_notifications_user_id    ON public.notifications(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (get_my_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (get_my_role() = 'admin');

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (get_my_role() = 'admin');

-- ---- games ----
CREATE POLICY "Authenticated users can view games"
  ON public.games FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert games"
  ON public.games FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Admins can update games"
  ON public.games FOR UPDATE
  USING (get_my_role() = 'admin');

CREATE POLICY "Admins can delete games"
  ON public.games FOR DELETE
  USING (get_my_role() = 'admin');

-- ---- game_registrations ----
CREATE POLICY "Authenticated users can view registrations"
  ON public.game_registrations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Players can register themselves"
  ON public.game_registrations FOR INSERT
  WITH CHECK (
    player_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR get_my_role() = 'admin'
  );

CREATE POLICY "Players can unregister themselves, admins can unregister anyone"
  ON public.game_registrations FOR DELETE
  USING (
    player_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR get_my_role() = 'admin'
  );

-- ---- teams ----
CREATE POLICY "Authenticated users can view teams"
  ON public.teams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage teams"
  ON public.teams FOR ALL
  USING (get_my_role() = 'admin');

-- ---- team_members ----
CREATE POLICY "Authenticated users can view team members"
  ON public.team_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage team members"
  ON public.team_members FOR ALL
  USING (get_my_role() = 'admin');

-- ---- transactions ----
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (player_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (get_my_role() = 'admin');

CREATE POLICY "Admins can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  USING (get_my_role() = 'admin');

-- ---- messages ----
CREATE POLICY "Authenticated users can view messages"
  ON public.messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own messages, admins any"
  ON public.messages FOR DELETE
  USING (
    sender_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR get_my_role() = 'admin'
  );

-- ---- invite_codes ----
CREATE POLICY "Admins can manage invite codes"
  ON public.invite_codes FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "Anyone authenticated can check invite codes"
  ON public.invite_codes FOR SELECT
  USING (auth.role() = 'authenticated');

-- ---- notifications ----
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE
  USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- ============================================================
-- REALTIME (enable for chat and game registrations)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

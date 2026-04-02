-- Subscriptions (monthly pass)
CREATE TABLE subscriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month             date NOT NULL,            -- first day of the month, e.g. 2026-04-01
  rent_cost         integer NOT NULL DEFAULT 0,  -- total arena rent in RUB
  bank_compensation integer NOT NULL DEFAULT 0,  -- compensation from club bank
  status            text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Members who signed up for a subscription
CREATE TABLE subscription_members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  player_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subscription_id, player_id)
);

-- Row level security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_members ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read subscriptions and members
CREATE POLICY "subscriptions_read" ON subscriptions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "subscription_members_read" ON subscription_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert/update/delete subscriptions
CREATE POLICY "subscriptions_admin_write" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Players can insert/delete their own membership
CREATE POLICY "subscription_members_self_insert" ON subscription_members
  FOR INSERT WITH CHECK (
    player_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "subscription_members_self_delete" ON subscription_members
  FOR DELETE USING (
    player_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Admins can manage all memberships
CREATE POLICY "subscription_members_admin" ON subscription_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Add max_players and price_rub columns to games table
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS max_players integer NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS price_rub   integer;

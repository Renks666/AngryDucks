export type UserRole = 'admin' | 'player' | 'guest';
export type SkillLevel = 'amateur' | 'medium' | 'pro';
export type GameStatus = 'open' | 'teams_formed' | 'completed';
export type TransactionType = 'subscription' | 'guest_payment' | 'expense' | 'adjustment';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  skill_level: SkillLevel;
  phone: string | null;
  push_token: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  date: string;          // ISO date string
  time: string;          // HH:MM
  location: string;
  description: string | null;
  status: GameStatus;
  price_rub: number | null; // price per person in RUB
  created_by: string;    // profile id
  created_at: string;
}

export interface GameRegistration {
  id: string;
  game_id: string;
  player_id: string | null;
  guest_name: string | null;
  registered_at: string;
  // joined
  profile?: Profile;
}

export interface Team {
  id: string;
  game_id: string;
  team_name: string;
  team_number: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string | null;
  guest_name: string | null;
  // joined
  profile?: Profile;
}

export interface Transaction {
  id: string;
  player_id: string | null;
  type: TransactionType;
  amount: number;          // positive = income, negative = expense
  description: string;
  game_id: string | null;
  created_by: string;
  created_at: string;
  // joined
  profile?: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  game_id: string | null;
  content: string;
  created_at: string;
  // joined
  sender?: Profile;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  type: string;
  created_at: string;
}

// Aggregated types
export interface PlayerBalance {
  profile: Profile;
  balance: number;       // positive = credit, negative = debt
}

export interface GameWithRegistrations extends Game {
  registrations: GameRegistration[];
  registrationCount: number;
  isRegistered: boolean;
  teams?: Team[];
}

export type SubscriptionStatus = 'open' | 'closed';

export interface Subscription {
  id: string;
  month: string;              // ISO date string, first day of month
  rent_cost: number;
  bank_compensation: number;
  status: SubscriptionStatus;
  created_by: string | null;
  created_at: string;
}

export interface SubscriptionMember {
  id: string;
  subscription_id: string;
  player_id: string;
  joined_at: string;
  // joined
  profile?: Profile;
}

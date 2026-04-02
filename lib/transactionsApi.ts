import { supabase } from './supabase';
import { Transaction, PlayerBalance, Profile, TransactionType } from './types';

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchMyTransactions(profileId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, profile:profiles!player_id(*)')
    .eq('player_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function fetchAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, profile:profiles!player_id(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function fetchMyBalance(profileId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('player_id', profileId);
  if (error) throw error;
  return (data ?? []).reduce((sum, t) => sum + (t.amount as number), 0);
}

export async function fetchClubBalance(): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount');
  if (error) throw error;
  return (data ?? []).reduce((sum, t) => sum + (t.amount as number), 0);
}

export async function fetchPlayerBalances(): Promise<PlayerBalance[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['player', 'admin'])
    .order('name');
  if (profilesError) throw profilesError;

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('player_id, amount')
    .not('player_id', 'is', null);
  if (txError) throw txError;

  const balanceMap: Record<string, number> = {};
  for (const tx of transactions ?? []) {
    if (tx.player_id) {
      balanceMap[tx.player_id] = (balanceMap[tx.player_id] ?? 0) + (tx.amount as number);
    }
  }

  return (profiles ?? []).map((p) => ({
    profile: p as Profile,
    balance: balanceMap[p.id] ?? 0,
  }));
}

export async function fetchAllPlayers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['player', 'admin'])
    .order('name');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export interface CreateTransactionInput {
  player_id: string | null;
  type: TransactionType;
  amount: number; // positive = income, negative = expense
  description: string;
  game_id: string | null;
  created_by: string;
}

export async function createTransaction(input: CreateTransactionInput): Promise<void> {
  const { error } = await supabase.from('transactions').insert(input);
  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

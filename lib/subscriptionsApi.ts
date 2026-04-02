import { supabase } from './supabase';
import { Subscription, SubscriptionMember } from './types';

// Fetch the active (open) subscription
export async function fetchActiveSubscription(): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'open')
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
}

// Fetch a subscription by id with full member list (profiles joined)
export async function fetchSubscriptionDetail(id: string): Promise<{
  subscription: Subscription;
  members: SubscriptionMember[];
}> {
  const [subRes, membersRes] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('id', id).single(),
    supabase
      .from('subscription_members')
      .select('*, profile:profiles!player_id(*)')
      .eq('subscription_id', id)
      .order('joined_at', { ascending: true }),
  ]);
  if (subRes.error) throw subRes.error;
  if (membersRes.error) throw membersRes.error;
  return {
    subscription: subRes.data as Subscription,
    members: membersRes.data as SubscriptionMember[],
  };
}

// Get current user's profile id
async function getMyProfileId(): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (error) throw error;
  return data.id;
}

// Join a subscription
export async function joinSubscription(subscriptionId: string): Promise<void> {
  const playerId = await getMyProfileId();
  const { error } = await supabase.from('subscription_members').insert({
    subscription_id: subscriptionId,
    player_id: playerId,
  });
  if (error) throw error;
}

// Leave a subscription
export async function leaveSubscription(subscriptionId: string): Promise<void> {
  const playerId = await getMyProfileId();
  const { error } = await supabase
    .from('subscription_members')
    .delete()
    .eq('subscription_id', subscriptionId)
    .eq('player_id', playerId);
  if (error) throw error;
}

// Admin: create a new subscription for a month
export async function createSubscription(params: {
  month: string;  // 'YYYY-MM-01'
  rent_cost: number;
  bank_compensation?: number;
}): Promise<Subscription> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user!.id)
    .single();

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      month: params.month,
      rent_cost: params.rent_cost,
      bank_compensation: params.bank_compensation ?? 0,
      created_by: profile!.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Subscription;
}

// Admin: update rent cost
export async function updateSubscriptionRent(id: string, rent_cost: number): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ rent_cost })
    .eq('id', id);
  if (error) throw error;
}

// Admin: update bank compensation
export async function updateBankCompensation(id: string, bank_compensation: number): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ bank_compensation })
    .eq('id', id);
  if (error) throw error;
}

// Admin: close a subscription
export async function closeSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'closed' })
    .eq('id', id);
  if (error) throw error;
}

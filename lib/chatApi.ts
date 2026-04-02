import { supabase } from './supabase';
import { Message } from './types';

export async function fetchMessages(limit = 80): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .is('game_id', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  // Return oldest-first for display
  return ((data ?? []) as Message[]).reverse();
}

export async function sendMessage(senderId: string, content: string): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    sender_id: senderId,
    content: content.trim(),
    game_id: null,
  });
  if (error) throw error;
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw error;
}

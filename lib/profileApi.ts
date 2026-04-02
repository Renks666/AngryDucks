import { supabase } from './supabase';
import { Profile, UserRole, SkillLevel, InviteCode } from './types';

// ─── Own profile ─────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  skill_level?: SkillLevel;
}

export async function updateMyProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchMyStats(profileId: string): Promise<{ gamesPlayed: number }> {
  const { count, error } = await supabase
    .from('game_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', profileId);
  if (error) throw error;
  return { gamesPlayed: count ?? 0 };
}

// ─── Admin: players ──────────────────────────────────────────────────────────

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfileRole(id: string, role: UserRole): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

export async function updateProfileSkill(id: string, skill_level: SkillLevel): Promise<void> {
  const { error } = await supabase.from('profiles').update({ skill_level }).eq('id', id);
  if (error) throw error;
}

// ─── Admin: invite codes ──────────────────────────────────────────────────────

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function generateInviteCode(createdBy: string): Promise<InviteCode> {
  const code = randomCode();
  const { data, error } = await supabase
    .from('invite_codes')
    .insert({ code, created_by: createdBy, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as InviteCode;
}

export async function fetchActiveInviteCodes(): Promise<InviteCode[]> {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('is_active', true)
    .is('used_by', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as InviteCode[];
}

export async function deactivateInviteCode(id: string): Promise<void> {
  const { error } = await supabase
    .from('invite_codes')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

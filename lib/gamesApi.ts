import { supabase } from './supabase';
import { Game, GameRegistration, Team, TeamMember } from './types';
import { GeneratedTeam } from '@/utils/teamGenerator';

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function fetchUpcomingGames(): Promise<Game[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  if (error) throw error;
  return data as Game[];
}

export async function fetchPastGames(): Promise<Game[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .lt('date', today)
    .order('date', { ascending: false })
    .order('time', { ascending: false });
  if (error) throw error;
  return data as Game[];
}

export async function fetchGame(id: string): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Game;
}

export async function fetchRegistrations(gameId: string): Promise<GameRegistration[]> {
  const { data, error } = await supabase
    .from('game_registrations')
    .select('*, profile:profiles(*)')
    .eq('game_id', gameId)
    .order('registered_at', { ascending: true });
  if (error) throw error;
  return data as unknown as GameRegistration[];
}

export interface TeamWithMembers {
  team: Team;
  members: TeamMember[];
}

export async function fetchTeams(gameId: string): Promise<TeamWithMembers[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members(*, profile:profiles(*))')
    .eq('game_id', gameId)
    .order('team_number', { ascending: true });
  if (error) throw error;

  return (data as any[]).map((t) => ({
    team: {
      id: t.id,
      game_id: t.game_id,
      team_name: t.team_name,
      team_number: t.team_number,
    } as Team,
    members: t.team_members as TeamMember[],
  }));
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function registerForGame(gameId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('game_registrations')
    .insert({ game_id: gameId, player_id: playerId });
  if (error) throw error;
}

export async function unregisterFromGame(gameId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('game_registrations')
    .delete()
    .eq('game_id', gameId)
    .eq('player_id', playerId);
  if (error) throw error;
}

export async function addGuestToGame(gameId: string, guestName: string): Promise<void> {
  const { error } = await supabase
    .from('game_registrations')
    .insert({ game_id: gameId, guest_name: guestName });
  if (error) throw error;
}

export async function removeRegistration(registrationId: string): Promise<void> {
  const { error } = await supabase
    .from('game_registrations')
    .delete()
    .eq('id', registrationId);
  if (error) throw error;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createGame(params: {
  date: string;
  time: string;
  location: string;
  description?: string;
  createdBy: string;
  price_rub?: number | null;
}): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert({
      date: params.date,
      time: params.time,
      location: params.location,
      description: params.description || null,
      created_by: params.createdBy,
      price_rub: params.price_rub ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Game;
}

export async function updateGame(
  id: string,
  params: Partial<Pick<Game, 'date' | 'time' | 'location' | 'description' | 'status' | 'price_rub'>>
): Promise<void> {
  const { error } = await supabase.from('games').update(params).eq('id', id);
  if (error) throw error;
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw error;
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function saveGeneratedTeams(
  gameId: string,
  generatedTeams: GeneratedTeam[]
): Promise<void> {
  // Delete existing teams (cascades to team_members)
  const { error: deleteError } = await supabase
    .from('teams')
    .delete()
    .eq('game_id', gameId);
  if (deleteError) throw deleteError;

  for (const genTeam of generatedTeams) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        game_id: gameId,
        team_name: genTeam.teamName,
        team_number: genTeam.teamNumber,
      })
      .select()
      .single();
    if (teamError) throw teamError;

    const members = genTeam.players.map((p) =>
      p.isGuest
        ? { team_id: team.id, player_id: null, guest_name: p.guestName ?? p.name }
        : { team_id: team.id, player_id: p.id, guest_name: null }
    );

    if (members.length > 0) {
      const { error: membersError } = await supabase
        .from('team_members')
        .insert(members);
      if (membersError) throw membersError;
    }
  }

  await supabase.from('games').update({ status: 'teams_formed' }).eq('id', gameId);
}

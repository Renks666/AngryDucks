export type SkillLevel = 'amateur' | 'medium' | 'pro';

export const SKILL_POINTS: Record<SkillLevel, number> = {
  amateur: 1,
  medium:  2,
  pro:     3,
};

export interface PlayerInput {
  id: string;
  name: string;
  skillLevel: SkillLevel;
  isGuest?: boolean;
  guestName?: string;
}

export interface GeneratedTeam {
  teamNumber: number;
  teamName: string;
  players: PlayerInput[];
  totalPoints: number;
}

const TEAM_NAMES = ['Команда А', 'Команда Б', 'Команда В', 'Команда Г', 'Команда Д'];

export function generateTeams(players: PlayerInput[], numTeams = 2): GeneratedTeam[] {
  if (players.length < 2) return [];

  const count = Math.min(numTeams, players.length);

  // Sort by skill descending for greedy assignment
  const sorted = [...players].sort(
    (a, b) => SKILL_POINTS[b.skillLevel] - SKILL_POINTS[a.skillLevel]
  );

  // Initialize teams
  const teams: GeneratedTeam[] = Array.from({ length: count }, (_, i) => ({
    teamNumber: i + 1,
    teamName: TEAM_NAMES[i] ?? `Команда ${i + 1}`,
    players: [],
    totalPoints: 0,
  }));

  // Greedy: assign each player to the team with the lowest current total
  for (const player of sorted) {
    const target = teams.reduce((min, t) => (t.totalPoints < min.totalPoints ? t : min), teams[0]);
    target.players.push(player);
    target.totalPoints += SKILL_POINTS[player.skillLevel];
  }

  return teams;
}

export function regenerateTeams(players: PlayerInput[], numTeams = 2): GeneratedTeam[] {
  // Shuffle players first for randomness, then balance
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return generateTeams(shuffled, numTeams);
}

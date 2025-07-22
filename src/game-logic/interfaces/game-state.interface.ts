import { RoleType } from '../../common/enums/role-type.enum';
import { GamePhase } from '../../common/enums/game-phase.enum';

export interface PlayerState {
  userId: string;
  nickname: string;
  role: RoleType;
  isAlive: boolean;
  voteTarget?: string;
  isProtected?: boolean;
  lastAction?: string; // Track last action (vote, kill, investigate, etc.)
}

export interface GameState {
  roomId: string;
  gameId?: string; // Link to database game record
  phase: GamePhase;
  dayNumber: number;
  players: PlayerState[];
  phaseEndTime: Date;
  winner?: 'mafia' | 'citizen' | 'villain';
  
  // Game mechanics
  currentPhaseStartTime: Date;
  phaseDuration: number; // in seconds
  eliminatedPlayers: string[]; // userIds of eliminated players
  
  // Voting state
  currentVoteTarget?: string;
  voteResults: Record<string, number>; // userId -> vote count
  
  // Night actions
  nightActions: {
    mafiaTarget?: string;
    policeTarget?: string;
    villainTarget?: string;
  };
  
  // Game settings
  settings: {
    dayPhaseDuration: number; // seconds
    nightPhaseDuration: number; // seconds
    votePhaseDuration: number; // seconds
  };
}

export interface GameSettings {
  dayPhaseDuration?: number;
  nightPhaseDuration?: number;
  votePhaseDuration?: number;
  mafiaCount?: number;
  policeCount?: number;
  villainCount?: number;
}
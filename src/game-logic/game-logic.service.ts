import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { RoleAssignmentService } from './services/role-assignment.service';
import { GameState, GameSettings } from './interfaces/game-state.interface';
import { GamePhase } from '../common/enums/game-phase.enum';
import { RoleType } from '../common/enums/role-type.enum';

@Injectable()
export class GameLogicService {
  private readonly logger = new Logger(GameLogicService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly roleAssignmentService: RoleAssignmentService,
  ) {}

  /**
   * Initialize a new game when room auto-starts
   */
  async initializeGame(roomId: string, playerIds: string[], playerNicknames: string[]): Promise<GameState> {
    this.logger.log(`Initializing game for room ${roomId} with ${playerIds.length} players`);

    // Assign roles to players
    const players = this.roleAssignmentService.assignRoles(playerIds, playerNicknames);

    // Create game state
    const gameState: GameState = {
      roomId,
      phase: GamePhase.STARTING,
      dayNumber: 0,
      players,
      phaseEndTime: new Date(Date.now() + 30000), // 30 seconds for starting phase
      currentPhaseStartTime: new Date(),
      phaseDuration: 30,
      eliminatedPlayers: [],
      voteResults: {},
      nightActions: {},
      settings: {
        dayPhaseDuration: 180, // 2 minutes
        nightPhaseDuration: 60, // 1 minute
        votePhaseDuration: 60, // 1 minute
      },
    };

    // Store game state in Redis
    await this.redisService.set(`game:${roomId}:state`, JSON.stringify(gameState), 3600); // 1 hour TTL

    // Log role assignments (for debugging)
    this.logGameState(gameState);

    return gameState;
  }

  /**
   * Get current game state
   */
  async getGameState(roomId: string): Promise<GameState | null> {
    const stateData = await this.redisService.get(`game:${roomId}:state`);
    return stateData ? JSON.parse(stateData) : null;
  }

  /**
   * Update game state
   */
  async updateGameState(roomId: string, gameState: GameState): Promise<void> {
    await this.redisService.set(`game:${roomId}:state`, JSON.stringify(gameState), 3600);
  }

  /**
   * Start the first night phase
   */
  async startFirstNight(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error(`Game state not found for room ${roomId}`);
    }

    gameState.phase = GamePhase.NIGHT;
    gameState.dayNumber = 1;
    gameState.currentPhaseStartTime = new Date();
    gameState.phaseEndTime = new Date(Date.now() + (gameState.settings.nightPhaseDuration * 1000));
    gameState.phaseDuration = gameState.settings.nightPhaseDuration;
    gameState.nightActions = {}; // Reset night actions

    await this.updateGameState(roomId, gameState);
    this.logger.log(`Started night ${gameState.dayNumber} for room ${roomId}`);

    return gameState;
  }

  /**
   * Transition to night phase
   */
  async transitionToNight(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error(`Game state not found for room ${roomId}`);
    }

    gameState.phase = GamePhase.NIGHT;
    gameState.currentPhaseStartTime = new Date();
    gameState.phaseEndTime = new Date(Date.now() + (gameState.settings.nightPhaseDuration * 1000));
    gameState.phaseDuration = gameState.settings.nightPhaseDuration;
    gameState.nightActions = {}; // Reset night actions

    await this.updateGameState(roomId, gameState);
    this.logger.log(`Transitioned to night phase for room ${roomId}`);

    return gameState;
  }

  /**
   * Transition from night to night_result (process night actions)
   */
  async transitionToNightResult(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) throw new Error('Game state not found');

    // Process night actions (e.g., mafia kill, police investigate)
    // Example: mafiaTarget elimination
    if (gameState.nightActions.mafiaTarget) {
      const targetPlayer = gameState.players.find(p => p.userId === gameState.nightActions.mafiaTarget);
      if (targetPlayer && targetPlayer.isAlive) {
        targetPlayer.isAlive = false;
        gameState.eliminatedPlayers.push(targetPlayer.userId);
      }
    }
    // (Add police/villain logic as needed)

    gameState.phase = GamePhase.NIGHT_RESULT;
    gameState.currentPhaseStartTime = new Date();
    gameState.phaseEndTime = new Date(Date.now() + 15000); // 15s for results
    gameState.phaseDuration = 15;

    await this.updateGameState(roomId, gameState);
    await this.checkWinConditions(roomId);
    return gameState;
  }

  /**
   * Transition from night_result to day (discussion)
   */
  async transitionToDay(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) throw new Error('Game state not found');

    gameState.phase = GamePhase.DAY;
    gameState.dayNumber += 1;
    gameState.currentPhaseStartTime = new Date();
    gameState.phaseEndTime = new Date(Date.now() + (gameState.settings.dayPhaseDuration * 1000));
    gameState.phaseDuration = gameState.settings.dayPhaseDuration;

    await this.updateGameState(roomId, gameState);
    return gameState;
  }

  /**
   * Transition from day to vote
   */
  async transitionToVote(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) throw new Error('Game state not found');

    gameState.phase = GamePhase.VOTE;
    gameState.currentPhaseStartTime = new Date();
    gameState.phaseEndTime = new Date(Date.now() + (gameState.settings.votePhaseDuration * 1000));
    gameState.phaseDuration = gameState.settings.votePhaseDuration;
    gameState.voteResults = {};

    await this.updateGameState(roomId, gameState);
    return gameState;
  }

  /**
   * Transition from vote to day_result (process votes)
   */
  async transitionToDayResult(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) throw new Error('Game state not found');

    // Process votes (eliminate player with most votes)
    if (gameState.voteResults && Object.keys(gameState.voteResults).length > 0) {
      // Find userId with max votes
      const maxVotes = Math.max(...Object.values(gameState.voteResults));
      const votedOut = Object.entries(gameState.voteResults)
        .filter(([_, count]) => count === maxVotes)
        .map(([userId]) => userId);
      // If tie, randomly pick one
      const eliminatedId = votedOut[Math.floor(Math.random() * votedOut.length)];
      const eliminatedPlayer = gameState.players.find(p => p.userId === eliminatedId);
      if (eliminatedPlayer && eliminatedPlayer.isAlive) {
        eliminatedPlayer.isAlive = false;
        gameState.eliminatedPlayers.push(eliminatedPlayer.userId);

        // Villain win condition: eliminated by vote
        if (eliminatedPlayer.role === RoleType.VILLAIN) {
          gameState.winner = 'villain';
          gameState.phase = GamePhase.VILLAGE_WINS;
          await this.updateGameState(roomId, gameState);
          return gameState; // End the game immediately
        }
      }
    }

    gameState.phase = GamePhase.DAY_RESULT;
    gameState.currentPhaseStartTime = new Date();
    gameState.phaseEndTime = new Date(Date.now() + 15000); // 15s for results
    gameState.phaseDuration = 15;

    await this.updateGameState(roomId, gameState);
    await this.checkWinConditions(roomId);
    return gameState;
  }

  /**
   * Check if game should end
   */
  async checkWinConditions(roomId: string): Promise<{ gameEnded: boolean; winner?: string }> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      return { gameEnded: false };
    }

    const alivePlayers = gameState.players.filter(p => p.isAlive);
    const mafiaCount = alivePlayers.filter(p => p.role === RoleType.MAFIA).length;
    
    // Count all non-mafia as citizens (including police, citizen, doctor, and villain)
    const citizenCount = alivePlayers.filter(
      p => p.role === RoleType.POLICE || p.role === RoleType.CITIZEN || p.role === RoleType.DOCTOR || p.role === RoleType.VILLAIN
    ).length;

    // Mafia wins if they outnumber or equal citizens
    if (mafiaCount >= citizenCount) {
      gameState.winner = 'mafia';
      gameState.phase = GamePhase.MAFIA_WINS;
      await this.updateGameState(roomId, gameState);
      return { gameEnded: true, winner: 'mafia' };
    }

    // Citizens win if all mafia are eliminated
    if (mafiaCount === 0) {
      gameState.winner = 'citizen';
      gameState.phase = GamePhase.CITIZENS_WINS;
      await this.updateGameState(roomId, gameState);
      return { gameEnded: true, winner: 'citizen' };
    }

    return { gameEnded: false };
  }

  /**
   * Get public game state (without revealing roles)
   */
  async getPublicGameState(roomId: string, requestingUserId?: string): Promise<any> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      return null;
    }

    const publicState = {
      roomId: gameState.roomId,
      phase: gameState.phase,
      dayNumber: gameState.dayNumber,
      phaseEndTime: gameState.phaseEndTime,
      winner: gameState.winner,
      players: gameState.players.map(player => ({
        userId: player.userId,
        nickname: player.nickname,
        isAlive: player.isAlive,
        role: requestingUserId === player.userId ? player.role : undefined, // Only show own role
      })),
      eliminatedPlayers: gameState.eliminatedPlayers,
    };

    return publicState;
  }

  /**
   * Log game state for debugging
   */
  private logGameState(gameState: GameState): void {
    this.logger.log(`Game initialized for room ${gameState.roomId}`);
    this.logger.log(`Players: ${gameState.players.map(p => `${p.nickname}(${p.role})`).join(', ')}`);
  }
}

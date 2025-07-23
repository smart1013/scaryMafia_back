import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { RoleAssignmentService } from './services/role-assignment.service';
import { GameState, GameSettings } from './interfaces/game-state.interface';
import { GamePhase } from '../common/enums/game-phase.enum';
import { RoleType } from '../common/enums/role-type.enum';
import { PlayerStateResponseDto } from './dto/player-state-response.dto';
import { NightActionResponseDto } from './dto/night-action-response.dto';
import { PoliceInvestigationResponseDto } from './dto/police-investigation-response.dto';
import { VoteResponseDto } from './dto/vote-response.dto';

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
      eliminatedPlayers: [],
      voteResults: {},
      nightActions: {},
      settings: {},
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
   * Transition to night phase
   */
  async transitionToNight(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error(`Game state not found for room ${roomId}`);
    }

    gameState.phase = GamePhase.NIGHT;
    gameState.nightActions = {}; // Reset night actions

    await this.updateGameState(roomId, gameState);
    
    // Initialize night actions in Redis
    await this.redisService.clearNightActions(roomId, gameState.dayNumber);
    
    this.logger.log(`Transitioned to night phase for room ${roomId}`);

    return gameState;
  }

  /**
   * Transition from night to night_result (process night actions)
   */
  async transitionToNightResult(roomId: string): Promise<GameState & { nightResult?: { eliminatedPlayer?: { userId: string; nickname: string; role: string }; wasProtected: boolean; mafiaTarget?: string; doctorTarget?: string } }> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) throw new Error('Game state not found');

    // Get night actions from Redis
    const nightActions = await this.redisService.getAllNightActions(roomId, gameState.dayNumber);
    
    let eliminatedPlayer: { userId: string; nickname: string; role: string } | undefined = undefined;
    let wasProtected = false;
    let mafiaTarget: string | undefined = undefined;
    let doctorTarget: string | undefined = undefined;
    
    // Process mafia kill
    if (nightActions['mafia_target']) {
      mafiaTarget = nightActions['mafia_target'];
      const targetPlayer = gameState.players.find(p => p.userId === mafiaTarget);
      
      // Check if doctor protected the target
      doctorTarget = nightActions['doctor_target'];
      wasProtected = doctorTarget === mafiaTarget;
      
      if (targetPlayer && targetPlayer.isAlive && !wasProtected) {
        targetPlayer.isAlive = false;
        gameState.eliminatedPlayers.push(targetPlayer.userId);
        eliminatedPlayer = {
          userId: targetPlayer.userId,
          nickname: targetPlayer.nickname,
          role: targetPlayer.role
        };
        this.logger.log(`Mafia killed ${targetPlayer.nickname}`);
      } else if (wasProtected) {
        this.logger.log(`Doctor protected ${targetPlayer?.nickname} from mafia attack`);
      }
    }

    // Process police investigation (store result for later retrieval)
    if (nightActions['police_target']) {
      const policeTarget = nightActions['police_target'];
      const targetPlayer = gameState.players.find(p => p.userId === policeTarget);
      if (targetPlayer) {
        // Store investigation result in Redis for police to retrieve
        await this.redisService.set(
          `game:${roomId}:investigation:${gameState.dayNumber}:${nightActions['police_target']}`,
          targetPlayer.role,
          3600
        );
      }
    }

    gameState.phase = GamePhase.NIGHT_RESULT;

    await this.updateGameState(roomId, gameState);
    await this.checkWinConditions(roomId);
    
    // Clear night actions after processing
    await this.redisService.clearNightActions(roomId, gameState.dayNumber);
    
    // Return game state with night result information
    return {
      ...gameState,
      nightResult: {
        eliminatedPlayer,
        wasProtected,
        mafiaTarget,
        doctorTarget
      }
    } as GameState & { nightResult?: { eliminatedPlayer?: { userId: string; nickname: string; role: string }; wasProtected: boolean; mafiaTarget?: string; doctorTarget?: string } };
  }

  /**
   * Transition from night_result to day (discussion)
   */
  async transitionToDay(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) throw new Error('Game state not found');

    gameState.phase = GamePhase.DAY;
    gameState.dayNumber += 1;

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
    gameState.voteResults = {};

    // Clear any previous votes for this day
    await this.redisService.clearGameVotes(roomId, gameState.dayNumber);

    await this.updateGameState(roomId, gameState);
    return gameState;
  }

  /**
   * Transition from vote to day_result (process votes)
   */
  async transitionToDayResult(roomId: string): Promise<GameState> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) throw new Error('Game state not found');

    // Get votes from Redis
    const votes = await this.redisService.getAllVotes(roomId, gameState.dayNumber);
    
    // Count votes for each target
    const voteCounts: Record<string, number> = {};
    for (const targetUserId of Object.values(votes)) {
      voteCounts[targetUserId] = (voteCounts[targetUserId] || 0) + 1;
    }

    // Process votes (eliminate player with most votes)
    if (Object.keys(voteCounts).length > 0) {
      const maxVotes = Math.max(...Object.values(voteCounts));
      const votedOut = Object.entries(voteCounts)
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
    
    // Clear votes after processing
    await this.redisService.clearGameVotes(roomId, gameState.dayNumber);

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
   * Get a specific player's complete state in an active game
   */
  async getPlayerState(roomId: string, userId: string): Promise<PlayerStateResponseDto | null> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      return null;
    }

    const player = gameState.players.find(p => p.userId === userId);
    if (!player) {
      return null;
    }

    return {
      userId: player.userId,
      nickname: player.nickname,
      role: player.role,
      isAlive: player.isAlive,
      voteTarget: player.voteTarget,
      isProtected: player.isProtected,
      lastAction: player.lastAction
    };
  }

  /**
   * Log game state for debugging
   */
  private logGameState(gameState: GameState): void {
    this.logger.log(`Game initialized for room ${gameState.roomId}`);
    this.logger.log(`Players: ${gameState.players.map(p => `${p.nickname}(${p.role})`).join(', ')}`);
  }

  /**
   * Process night action for a specific role
   */
  async processNightAction(
    roomId: string, 
    userId: string, 
    role: string, 
    targetUserId: string
  ): Promise<NightActionResponseDto> {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Validate game phase
    if (gameState.phase !== GamePhase.NIGHT) {
      throw new Error('Night actions can only be performed during night phase');
    }

    // Validate player role
    const player = gameState.players.find(p => p.userId === userId);
    if (!player || player.role !== role || !player.isAlive) {
      throw new Error(`Player is not a valid ${role} or is not alive`);
    }

    // Validate target player
    const targetPlayer = gameState.players.find(p => p.userId === targetUserId);
    if (!targetPlayer || !targetPlayer.isAlive) {
      throw new Error('Target player not found or not alive');
    }

    // Set night action in Redis
    await this.redisService.setNightAction(roomId, gameState.dayNumber, role, targetUserId);

    // Check if all actions are complete (pass alive player IDs to handle eliminated roles)
    const alivePlayerIds = gameState.players.filter(p => p.isAlive).map(p => p.userId);
    const allComplete = await this.redisService.checkNightActionCompletion(roomId, gameState.dayNumber, alivePlayerIds);

    return {
      success: true,
      message: `${role} selected ${targetPlayer.nickname} as target`,
      role,
      targetUserId,
      allActionsComplete: allComplete
    };
  }

  /**
   * Get all night actions for a room
   */
  async getNightActions(roomId: string) {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    const nightActions = await this.redisService.getAllNightActions(roomId, gameState.dayNumber);
    
    // Only return target selections, not the completion status
    const actions = {
      mafiaTarget: nightActions['mafia_target'] || null,
      doctorTarget: nightActions['doctor_target'] || null,
      policeTarget: nightActions['police_target'] || null
    };

    return {
      roomId,
      dayNumber: gameState.dayNumber,
      actions
    };
  }

  /**
   * Get night action completion status
   */
  async getNightActionStatus(roomId: string) {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Pass alive player IDs to handle eliminated roles
    const alivePlayerIds = gameState.players.filter(p => p.isAlive).map(p => p.userId);
    return await this.redisService.getNightActionStatus(roomId, gameState.dayNumber, alivePlayerIds);
  }

  /**
   * Get police investigation result for the current game
   */
  async getPoliceInvestigationResult(roomId: string) {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    // Only show investigation results during DAY phase or later
    if (gameState.phase === GamePhase.NIGHT ) {
      return {
        success: false,
        message: 'Investigation results are not available during night phase',
        investigationResults: null
      };
    }

    // Get all investigation results for the current day
    const investigationResults = await this.redisService.getAllPoliceInvestigationResults(
      roomId, 
      gameState.dayNumber
    );

    // Map user IDs to player nicknames and create a more detailed response
    const resultsWithDetails: Array<{
      targetUserId: string;
      targetNickname: string;
      targetRole: string;
      isAlive: boolean;
    }> = [];
    for (const [targetUserId, targetRole] of Object.entries(investigationResults)) {
      const targetPlayer = gameState.players.find(p => p.userId === targetUserId);
      if (targetPlayer) {
        resultsWithDetails.push({
          targetUserId,
          targetNickname: targetPlayer.nickname,
          targetRole,
          isAlive: targetPlayer.isAlive
        });
      }
    }

    return {
      success: true,
      message: `Investigation results for day ${gameState.dayNumber}`,
      dayNumber: gameState.dayNumber,
      gamePhase: gameState.phase,
      investigationResults: resultsWithDetails
    };
  }

  /**
   * Get all police investigation results (for game master/host)
   */
  async getAllPoliceInvestigationResults(roomId: string) {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    const investigationResults = await this.redisService.getAllPoliceInvestigationResults(
      roomId, 
      gameState.dayNumber
    );

    // Map user IDs to player nicknames
    const resultsWithNicknames = {};
    for (const [targetUserId, targetRole] of Object.entries(investigationResults)) {
      const targetPlayer = gameState.players.find(p => p.userId === targetUserId);
      if (targetPlayer) {
        resultsWithNicknames[targetPlayer.nickname] = targetRole;
      }
    }

    return {
      roomId,
      dayNumber: gameState.dayNumber,
      investigationResults: resultsWithNicknames
    };
  }

  async submitVote(roomId: string, userId: string, targetUserId: string): Promise<VoteResponseDto> {
  const gameState = await this.getGameState(roomId);
  if (!gameState) {
    throw new BadRequestException('Game state not found');
  }

  // Validate game phase
  if (gameState.phase !== GamePhase.VOTE) {
    throw new BadRequestException('Voting can only be done during vote phase');
  }

  // Validate player
  const player = gameState.players.find(p => p.userId === userId);
  if (!player || !player.isAlive) {
    throw new BadRequestException('Player not found or not alive');
  }

  // Check if player has already voted
  const existingVote = await this.redisService.getPlayerVote(roomId, gameState.dayNumber, userId);
  if (existingVote) {
    const previousTarget = gameState.players.find(p => p.userId === existingVote);
    throw new BadRequestException(`${player.nickname} has already voted to eliminate ${previousTarget?.nickname || 'someone'}. You cannot vote again.`);
  }

  // Prevent self-voting
  if (userId === targetUserId) {
    throw new BadRequestException(`${player.nickname} cannot vote to eliminate themselves.`);
  }

  // Validate target
  const targetPlayer = gameState.players.find(p => p.userId === targetUserId);
  if (!targetPlayer || !targetPlayer.isAlive) {
    throw new BadRequestException('Target player not found or not alive');
  }

  // Store vote in Redis
  await this.redisService.setPlayerVote(roomId, gameState.dayNumber, userId, targetUserId);

  // Check if all alive players have voted
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const allVotesComplete = await this.redisService.checkVoteCompletion(
    roomId, 
    gameState.dayNumber, 
    alivePlayers.map(p => p.userId)
  );

  return {
    success: true,
    message: `${player.nickname} voted to eliminate ${targetPlayer.nickname}`,
    voteCount: alivePlayers.length,
    allVotesComplete
  };
}

  async getVoteStatus(roomId: string) {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    const votes = await this.redisService.getAllVotes(roomId, gameState.dayNumber);
    
    // Count votes for each target
    const voteCounts: Record<string, number> = {};
    for (const targetUserId of Object.values(votes)) {
      voteCounts[targetUserId] = (voteCounts[targetUserId] || 0) + 1;
    }

    // Find players with most votes
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const topTargets = Object.entries(voteCounts)
      .filter(([_, count]) => count === maxVotes)
      .map(([userId]) => userId);

    return {
      roomId,
      dayNumber: gameState.dayNumber,
      votes,
      voteCounts,
      topTargets,
      maxVotes,
      tie: topTargets.length > 1
    };
  }

  async getVoteCompletion(roomId: string) {
    const gameState = await this.getGameState(roomId);
    if (!gameState) {
      throw new Error('Game state not found');
    }

    const alivePlayers = gameState.players.filter(p => p.isAlive);
    const votes = await this.redisService.getAllVotes(roomId, gameState.dayNumber);
    
    const votedPlayers = Object.keys(votes);
    const remainingPlayers = alivePlayers.filter(p => !votedPlayers.includes(p.userId));

    return {
      roomId,
      dayNumber: gameState.dayNumber,
      totalAlivePlayers: alivePlayers.length,
      votedPlayers: votedPlayers.length,
      remainingPlayers: remainingPlayers.map(p => ({
        userId: p.userId,
        nickname: p.nickname
      })),
      allVotesComplete: votedPlayers.length === alivePlayers.length
    };
  }
}

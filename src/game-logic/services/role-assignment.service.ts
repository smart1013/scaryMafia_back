import { Injectable } from '@nestjs/common';
import { RoleType } from '../../common/enums/role-type.enum';
import { PlayerState } from '../interfaces/game-state.interface';

@Injectable()
export class RoleAssignmentService {
  
  /**
   * Assign roles to players based on player count
   */
  assignRoles(playerIds: string[], playerNicknames: string[]): PlayerState[] {
    const playerCount = playerIds.length;
    const roleDistribution = this.getRoleDistribution(playerCount);
    
    const players: PlayerState[] = [];
    const roles = this.generateRoleArray(roleDistribution);
    
    // Shuffle roles for random assignment
    this.shuffleArray(roles);
    
    // Assign roles to players
    for (let i = 0; i < playerIds.length; i++) {
      players.push({
        userId: playerIds[i],
        nickname: playerNicknames[i],
        role: roles[i],
        isAlive: true,
      });
    }
    
    return players;
  }
  
  /**
   * Get role distribution based on player count
   */
  private getRoleDistribution(playerCount: number): Record<RoleType, number> {
    switch (playerCount) {
      case 8:
        return { mafia: 2, police: 1, doctor: 1, citizen: 3, villain: 1 };
      case 9:
        return { mafia: 2, police: 1, doctor: 1, citizen: 4, villain: 1 };
      case 10:
        return { mafia: 3, police: 1, doctor: 1, citizen: 4, villain: 1 };
      case 11:
        return { mafia: 3, police: 1, doctor: 1, citizen: 5, villain: 1 };
      case 12:
        return { mafia: 4, police: 1, doctor: 1, citizen: 6, villain: 1 };
      default:
        throw new Error(`Unsupported player count: ${playerCount}`);
    }
  }
  
  /**
   * Generate array of roles based on distribution
   */
  private generateRoleArray(distribution: Record<RoleType, number>): RoleType[] {
    const roles: RoleType[] = [];
    
    Object.entries(distribution).forEach(([role, count]) => {
      for (let i = 0; i < count; i++) {
        roles.push(role as RoleType);
      }
    });
    
    return roles;
  }
  
  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
} 
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { GamePhase } from '../src/common/enums/game-phase.enum';

describe('Game Logic (e2e)', () => {
  let app: INestApplication;
  let authTokens: { [key: string]: string } = {};
  let testUsers: { [key: string]: any } = {};
  let testRoomId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Game Logic Flow', () => {
    it('should create test users for game', async () => {
      // Create 8 test users
      const userData = [
        { userEmail: 'player1@test.com', password: 'password123', nickname: 'player1' },
        { userEmail: 'player2@test.com', password: 'password123', nickname: 'player2' },
        { userEmail: 'player3@test.com', password: 'password123', nickname: 'player3' },
        { userEmail: 'player4@test.com', password: 'password123', nickname: 'player4' },
        { userEmail: 'player5@test.com', password: 'password123', nickname: 'player5' },
        { userEmail: 'player6@test.com', password: 'password123', nickname: 'player6' },
        { userEmail: 'player7@test.com', password: 'password123', nickname: 'player7' },
        { userEmail: 'player8@test.com', password: 'password123', nickname: 'player8' },
      ];

      for (const user of userData) {
        const response = await request(app.getHttpServer())
          .post('/auth/signup')
          .send(user)
          .expect(201);

        testUsers[user.nickname] = response.body;
      }

      expect(Object.keys(testUsers)).toHaveLength(8);
    });

    it('should create a room with auto-start functionality', async () => {
      const createRoomResponse = await request(app.getHttpServer())
        .post('/rooms')
        .send({
          title: 'Test Game Room',
          notes: 'Testing game logic flow',
          hostUserId: testUsers.player1.userId,
          requiredPlayers: 8
        })
        .expect(201);

      testRoomId = createRoomResponse.body.roomId;
      expect(testRoomId).toBeDefined();
      expect(createRoomResponse.body.status).toBe('waiting');
      expect(createRoomResponse.body.requiredPlayers).toBe(8);
    });

    it('should join all players to the room', async () => {
      const players = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
      
      for (const playerNickname of players) {
        const response = await request(app.getHttpServer())
          .post(`/rooms/${testRoomId}/join`)
          .send({
            userId: testUsers[playerNickname].userId
          })
          .expect(201);

        console.log(`Player ${playerNickname} joined:`, response.body.message);
      }

      // Check room participants
      const participantsResponse = await request(app.getHttpServer())
        .get(`/rooms/${testRoomId}/participants`)
        .expect(200);

      expect(participantsResponse.body.count).toBe(8);
      expect(participantsResponse.body.canStartGame).toBe(true);
    });

    it('should get initial game state', async () => {
      const response = await request(app.getHttpServer())
        .get(`/game-logic/state/${testRoomId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.roomId).toBe(testRoomId);
      expect(response.body.players).toHaveLength(8);
      expect(response.body.phase).toBe(GamePhase.STARTING);
      expect(response.body.dayNumber).toBe(0);
    });

    it('should start the first night phase', async () => {
      const response = await request(app.getHttpServer())
        .post(`/game-logic/start-night/${testRoomId}`)
        .expect(201);

      expect(response.body.phase).toBe(GamePhase.NIGHT);
      expect(response.body.dayNumber).toBe(1);
      expect(response.body.phaseDuration).toBe(60); // 1 minute
      expect(response.body.nightActions).toEqual({});
    });

    it('should transition to night result phase', async () => {
      const response = await request(app.getHttpServer())
        .post(`/game-logic/transition-night-result/${testRoomId}`)
        .expect(201);

      expect(response.body.phase).toBe(GamePhase.NIGHT_RESULT);
      expect(response.body.dayNumber).toBe(1);
    });

    it('should transition to day phase', async () => {
      const response = await request(app.getHttpServer())
        .post(`/game-logic/transition-day/${testRoomId}`)
        .expect(201);

      expect(response.body.phase).toBe(GamePhase.DAY);
      expect(response.body.phaseDuration).toBe(180); // 3 minutes
    });

    it('should transition to vote phase', async () => {
      const response = await request(app.getHttpServer())
        .post(`/game-logic/transition-vote/${testRoomId}`)
        .expect(201);

      expect(response.body.phase).toBe(GamePhase.VOTE);
      expect(response.body.phaseDuration).toBe(60); // 1 minute
    });

    it('should transition to day result phase', async () => {
      const response = await request(app.getHttpServer())
        .post(`/game-logic/transition-day-result/${testRoomId}`)
        .expect(201);

      expect(response.body.phase).toBe(GamePhase.DAY_RESULT);
    });

    it('should check win conditions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/game-logic/check-win/${testRoomId}`)
        .expect(200);

      expect(response.body).toHaveProperty('gameEnded');
      expect(response.body).toHaveProperty('winner');
      
      // Since no players are eliminated yet, game should not be ended
      expect(response.body.gameEnded).toBe(false);
    });

    it('should get public game state for a specific player', async () => {
      const response = await request(app.getHttpServer())
        .get(`/game-logic/public-state/${testRoomId}`)
        .send({
          userId: testUsers.player1.userId
        })
        .expect(200);

      expect(response.body.roomId).toBe(testRoomId);
      expect(response.body.phase).toBe(GamePhase.DAY_RESULT);
      expect(response.body.players).toHaveLength(8);
      
      // Check that the requesting player can see their own role
      const requestingPlayer = response.body.players.find(
        (p: any) => p.userId === testUsers.player1.userId
      );
      expect(requestingPlayer.role).toBeDefined();
      
      // Check that other players' roles are hidden
      const otherPlayer = response.body.players.find(
        (p: any) => p.userId === testUsers.player2.userId
      );
      expect(otherPlayer.role).toBeUndefined();
    });

    it('should transition to next night phase', async () => {
      const response = await request(app.getHttpServer())
        .post(`/game-logic/transition-night/${testRoomId}`)
        .expect(201);

      expect(response.body.phase).toBe(GamePhase.NIGHT);
      expect(response.body.dayNumber).toBe(2);
      expect(response.body.phaseDuration).toBe(60);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid room ID', async () => {
      const invalidRoomId = 'invalid-room-id';
      
      await request(app.getHttpServer())
        .get(`/game-logic/state/${invalidRoomId}`)
        .expect(404);
    });

    it('should handle game state not found', async () => {
      const nonExistentRoomId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .post(`/game-logic/start-night/${nonExistentRoomId}`)
        .expect(500); // Should throw error for non-existent game state
    });
  });

  describe('Game State Persistence', () => {
    it('should persist game state across requests', async () => {
      // Get game state
      const state1 = await request(app.getHttpServer())
        .get(`/game-logic/state/${testRoomId}`)
        .expect(200);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get game state again
      const state2 = await request(app.getHttpServer())
        .get(`/game-logic/state/${testRoomId}`)
        .expect(200);

      // States should be identical
      expect(state1.body.roomId).toBe(state2.body.roomId);
      expect(state1.body.phase).toBe(state2.body.phase);
      expect(state1.body.dayNumber).toBe(state2.body.dayNumber);
      expect(state1.body.players).toHaveLength(state2.body.players.length);
    });
  });
}); 
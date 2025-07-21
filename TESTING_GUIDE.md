# 🧪 Scary Mafia Backend Testing Guide

This guide will help you test your Mafia game backend systematically.

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **Docker** and **Docker Compose**
3. **Postman** or **Thunder Client** (VS Code extension)
4. **Axios** (for script testing)

## 🚀 Quick Start Testing

### Step 1: Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify services are running
docker ps
```

### Step 2: Install Dependencies & Start Backend

```bash
# Install dependencies
npm install

# Start the backend in development mode
npm run start:dev
```

### Step 3: Run Quick Test Script

```bash
# Install axios if not already installed
npm install axios

# Run the test script
node test-script.js
```

## 🔧 Manual Testing with Postman/Thunder Client

### Import Test Collection

1. Open **Postman** or **Thunder Client**
2. Import the `test-collection.json` file
3. The collection contains 8 folders with organized tests

### Test Execution Order

Run the tests in this order:

1. **Infrastructure Tests** - Verify Redis connection
2. **Authentication Tests** - Register and login users
3. **User Management Tests** - Test user operations
4. **Room Management Tests** - Create and manage rooms
5. **Game Logic Tests** - Test game state and transitions
6. **Game Management Tests** - Test game CRUD operations
7. **Game Participants Tests** - Test participant management
8. **Cleanup Tests** - Clean up test data

## 🎯 Key Test Scenarios

### Scenario 1: Basic User Flow

1. **Register 2 users**
2. **Create a room** with one user as host
3. **Join room** with second user
4. **Check participants** and game start status
5. **Verify room state**

### Scenario 2: Game Auto-Start

1. **Create room** with required players = 8
2. **Join with 8 users** (you'll need to register more users)
3. **Verify game starts automatically**
4. **Check game state** and role assignments

### Scenario 3: Game Phase Transitions

1. **Start a game** (after auto-start or manually)
2. **Test night phase** transitions
3. **Test day phase** transitions
4. **Test voting phase** transitions
5. **Verify win conditions**

## 🔍 What to Look For

### ✅ Success Indicators

- **HTTP 200** responses
- **Proper JSON** structure in responses
- **Consistent data** across related endpoints
- **Redis connection** working
- **Database operations** successful

### ❌ Common Issues to Watch For

- **Connection errors** (check if services are running)
- **Validation errors** (check request body format)
- **Database errors** (check PostgreSQL connection)
- **Redis errors** (check Redis connection)
- **Role assignment** issues (check player count)

## 📊 Expected Test Results

### Infrastructure Tests
- Redis connection: ✅ Connected
- Redis status: ✅ Connected with server info
- Redis ping: ✅ PONG response

### Authentication Tests
- User registration: ✅ 200 with userId
- User login: ✅ 200 with user info
- Duplicate registration: ❌ 409 Conflict

### Room Management Tests
- Room creation: ✅ 200 with roomId
- Room joining: ✅ 200 with success message
- Participant count: ✅ Correct number
- Game start check: ✅ Proper boolean response

### Game Logic Tests
- Game state: ✅ Null initially, then game state object
- Phase transitions: ✅ Proper phase changes
- Win conditions: ✅ Correct win logic

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Connection refused" errors
```bash
# Check if services are running
docker ps

# Restart services if needed
docker-compose down
docker-compose up -d postgres redis
```

#### 2. "Validation failed" errors
- Check request body format
- Ensure all required fields are present
- Verify data types (strings, numbers, etc.)

#### 3. "Database connection" errors
```bash
# Check PostgreSQL logs
docker logs mafia_postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### 4. "Redis connection" errors
```bash
# Check Redis logs
docker logs mafia_redis

# Restart Redis
docker-compose restart redis
```

### Debug Mode

Enable debug logging in your backend:

```typescript
// In main.ts, add:
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}));
```

## 🧪 Advanced Testing

### Load Testing

Test with multiple concurrent users:

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test scenario
artillery quick --count 10 --num 5 http://localhost:8000/redis/test
```

### Integration Testing

Test the complete game flow:

1. **Register 8 users**
2. **Create room** with 8 required players
3. **Join all users** to trigger auto-start
4. **Verify game initialization**
5. **Test all phase transitions**
6. **Verify win conditions**

### Edge Case Testing

- **Invalid user IDs** in requests
- **Non-existent room IDs**
- **Duplicate user registrations**
- **Room capacity limits**
- **Invalid game phase transitions**

## 📈 Performance Testing

### Monitor Resource Usage

```bash
# Monitor Docker containers
docker stats

# Monitor database connections
docker exec -it mafia_postgres psql -U postgres -d mafia -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor Redis memory
docker exec -it mafia_redis redis-cli info memory
```

## 🎯 Test Checklist

- [ ] Infrastructure services running
- [ ] Backend application starting without errors
- [ ] Redis connection working
- [ ] Database connection working
- [ ] User registration working
- [ ] User login working
- [ ] Room creation working
- [ ] Room joining working
- [ ] Participant management working
- [ ] Game auto-start working
- [ ] Game state management working
- [ ] Phase transitions working
- [ ] Win conditions working
- [ ] Error handling working
- [ ] Data validation working

## 🚀 Next Steps After Testing

Once basic testing is complete:

1. **Implement WebSocket** for real-time updates
2. **Add night action processing**
3. **Implement voting system**
4. **Add game history tracking**
5. **Implement JWT authentication**
6. **Add rate limiting**
7. **Add comprehensive unit tests**
8. **Add end-to-end tests**

## 📞 Getting Help

If you encounter issues:

1. **Check the logs**: `docker logs mafia_postgres` and `docker logs mafia_redis`
2. **Verify configuration**: Check database and Redis connection settings
3. **Review API documentation**: Check `API_DOCUMENTATION..txt`
4. **Test individual endpoints**: Use Postman/Thunder Client for isolated testing

Happy testing! 🎮 
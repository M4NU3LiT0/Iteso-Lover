// Backend basic unit tests
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const mongoose = require('mongoose');

// Note: Configure TEST_MONGODB_URI in .env for testing
const testDbUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/iteso-lover-test';

beforeAll(async () => {
  await mongoose.connect(testDbUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@iteso.mx',
          password: 'Password123',
          passwordConfirm: 'Password123',
          gender: 'male'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('email');
      expect(res.body.tokens).toHaveProperty('accessToken');
    });

    it('should fail with invalid email domain', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@gmail.com',
          password: 'Password123',
          passwordConfirm: 'Password123',
          gender: 'male'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@iteso.mx',
          password: 'weak',
          passwordConfirm: 'weak',
          gender: 'male'
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@iteso.mx',
          password: 'Password123',
          passwordConfirm: 'Password123',
          gender: 'male'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'juan@iteso.mx',
          password: 'Password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens).toHaveProperty('accessToken');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'juan@iteso.mx',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toEqual(401);
    });

    it('should fail with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@iteso.mx',
          password: 'Password123'
        });

      expect(res.statusCode).toEqual(401);
    });
  });
});

describe('User Endpoints', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});

    // Register and login
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@iteso.mx',
        password: 'Password123',
        passwordConfirm: 'Password123',
        gender: 'male'
      });

    token = registerRes.body.tokens.accessToken;
    userId = registerRes.body.user._id;
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user._id).toBe(userId);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update profile', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bio: 'Me gusta estudiar y viajar',
          interests: ['Viajes', 'Música'],
          careerGoal: 'Ingeniero de Software'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.bio).toBe('Me gusta estudiar y viajar');
    });
  });

  describe('GET /api/users/search', () => {
    beforeEach(async () => {
      // Create additional users
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'María',
          lastName: 'García',
          email: 'maria@iteso.mx',
          password: 'Password123',
          passwordConfirm: 'Password123',
          gender: 'female'
        });
    });

    it('should search users', async () => {
      const res = await request(app)
        .get('/api/users/search?q=María')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.users.length).toBeGreaterThan(0);
    });
  });
});

const request = require('supertest');
const app = require('../app');

describe('Auth', () => {
  test('registers a new buyer and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Buyer',
      email: 'buyer@test.com',
      password: 'Password123',
      role: 'buyer',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('buyer@test.com');
    expect(res.body.data.token).toBeDefined();
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'A', email: 'dup@test.com', password: 'Password123', role: 'buyer',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'B', email: 'dup@test.com', password: 'Password123', role: 'buyer',
    });
    expect(res.statusCode).toBe(409);
  });

  test('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'C', email: 'wrongpass@test.com', password: 'Password123', role: 'buyer',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpass@test.com', password: 'WrongPassword1',
    });
    expect(res.statusCode).toBe(401);
  });

  test('blocks access to a protected route without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

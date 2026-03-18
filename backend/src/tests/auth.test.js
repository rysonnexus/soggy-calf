const request = require('supertest')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

process.env.JWT_SECRET = 'test_jwt_secret_that_is_at_least_32_chars_long_ok'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_different_and_32chars_ok'
process.env.NODE_ENV = 'test'
process.env.FRONTEND_URL = 'http://localhost:5173'

// Pre-computed hashes (cost 1 for test speed) - prefixed "mock" so Jest allows them
const mockDmHash = bcrypt.hashSync('1234', 1)
const mockPlayerHash = bcrypt.hashSync('5678', 1)
const mockLockedHash = bcrypt.hashSync('9999', 1)
const mockRefreshTokens = new Map()

const mockUsers = {
  dm:      { id: 1, username: 'dm',      pinHash: mockDmHash,    role: 'DM',     isLocked: false, lockedUntil: null, failedAttempts: 0, mustChangePIN: false },
  player1: { id: 2, username: 'player1', pinHash: mockPlayerHash, role: 'PLAYER', isLocked: false, lockedUntil: null, failedAttempts: 0, mustChangePIN: false },
  locked:  { id: 3, username: 'locked',  pinHash: mockLockedHash, role: 'PLAYER', isLocked: true,  lockedUntil: new Date(Date.now() + 9999999), failedAttempts: 5, mustChangePIN: false },
}

const mockCrypto = require('crypto')

function mockMakeAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username, jti: mockCrypto.randomBytes(8).toString('hex') },
    process.env.JWT_SECRET,
    { expiresIn: 900 }
  )
}

jest.mock('../services/authService', () => ({
  hashPIN: (pin) => require('bcrypt').hashSync(String(pin), 1),
  prisma: {
    user: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), updateMany: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  },
  loginWithPIN: jest.fn(),
  rotateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  changePIN: jest.fn(),
}))

const authService = require('../services/authService')
const app = require('../index')

beforeEach(() => {
  jest.clearAllMocks()
  mockRefreshTokens.clear()

  authService.loginWithPIN.mockImplementation(async (username, pin) => {
    const user = mockUsers[username.toLowerCase()]
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 })
    if (user.isLocked) throw Object.assign(new Error('Account is locked'), { status: 423 })
    const valid = bcrypt.compareSync(String(pin), user.pinHash)
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 })
    const accessToken = mockMakeAccessToken(user)
    const rt = `mock_rt_${user.id}_${Date.now()}`
    mockRefreshTokens.set(rt, { userId: user.id, revoked: false })
    return { accessToken, refreshToken: rt, expiresIn: 900, user: { id: user.id, username: user.username, role: user.role, mustChangePIN: user.mustChangePIN } }
  })

  authService.rotateRefreshToken.mockImplementation(async (raw) => {
    const stored = mockRefreshTokens.get(raw)
    if (!stored || stored.revoked) throw Object.assign(new Error('Invalid token'), { status: 401 })
    stored.revoked = true
    const user = Object.values(mockUsers).find(u => u.id === stored.userId)
    const accessToken = mockMakeAccessToken(user)
    const newRaw = `mock_rt_rotated_${user.id}_${Date.now()}`
    mockRefreshTokens.set(newRaw, { userId: user.id, revoked: false })
    return { accessToken, refreshToken: newRaw, expiresIn: 900, user: { id: user.id, username: user.username, role: user.role, mustChangePIN: user.mustChangePIN } }
  })

  authService.revokeRefreshToken.mockImplementation(async (raw) => {
    const s = mockRefreshTokens.get(raw)
    if (s) s.revoked = true
  })

  authService.changePIN.mockResolvedValue(undefined)
  authService.prisma.user.findMany.mockResolvedValue([])
  authService.prisma.user.create.mockResolvedValue({ id: 99, username: 'newplayer', isLocked: false, failedAttempts: 0, mustChangePIN: true, createdAt: new Date() })
})

async function loginAs(username, pin) {
  return request(app).post('/auth/login').send({ username, pin })
}

describe('POST /auth/login', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/auth/login').send({})
    expect(res.status).toBe(400)
  })
  it('returns 400 for PIN shorter than 4 digits', async () => {
    const res = await request(app).post('/auth/login').send({ username: 'dm', pin: '12' })
    expect(res.status).toBe(400)
  })
  it('returns 400 when username missing', async () => {
    const res = await request(app).post('/auth/login').send({ pin: '1234' })
    expect(res.status).toBe(400)
  })
  it('returns 401 for unknown username', async () => {
    const res = await loginAs('nobody', '1234')
    expect(res.status).toBe(401)
  })
  it('returns 401 for wrong PIN', async () => {
    const res = await loginAs('dm', '9999')
    expect(res.status).toBe(401)
  })
  it('returns 423 for locked account', async () => {
    const res = await loginAs('locked', '9999')
    expect(res.status).toBe(423)
  })
  it('returns 200 with accessToken and DM user', async () => {
    const res = await loginAs('dm', '1234')
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.user.role).toBe('DM')
  })
  it('returns 200 with accessToken and PLAYER user', async () => {
    const res = await loginAs('player1', '5678')
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('PLAYER')
  })
  it('sets httpOnly refresh token cookie on success', async () => {
    const res = await loginAs('dm', '1234')
    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true)
    expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true)
  })
})

describe('POST /auth/refresh', () => {
  it('returns 401 without cookie', async () => {
    const res = await request(app).post('/auth/refresh')
    expect(res.status).toBe(401)
  })
  it('rotates token and returns new accessToken', async () => {
    const loginRes = await loginAs('dm', '1234')
    const cookie = loginRes.headers['set-cookie']?.[0]
    const refreshRes = await request(app).post('/auth/refresh').set('Cookie', cookie)
    expect(refreshRes.status).toBe(200)
    expect(refreshRes.body.accessToken).toBeTruthy()
    expect(refreshRes.body.accessToken).not.toBe(loginRes.body.accessToken)
  })
})

describe('POST /auth/logout', () => {
  it('returns 200 and clears cookie', async () => {
    const loginRes = await loginAs('dm', '1234')
    const cookie = loginRes.headers['set-cookie']?.[0]
    const res = await request(app).post('/auth/logout').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('GET /admin/players - RBAC', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/admin/players')
    expect(res.status).toBe(401)
  })
  it('returns 403 for PLAYER role', async () => {
    const loginRes = await loginAs('player1', '5678')
    const res = await request(app).get('/admin/players')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
    expect(res.status).toBe(403)
  })
  it('returns 200 for DM role', async () => {
    const loginRes = await loginAs('dm', '1234')
    const res = await request(app).get('/admin/players')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /admin/players - create player', () => {
  it('returns 403 for player role', async () => {
    const loginRes = await loginAs('player1', '5678')
    const res = await request(app).post('/admin/players')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .send({ username: 'newguy', pin: '4321' })
    expect(res.status).toBe(403)
  })
  it('returns 400 when PIN is invalid', async () => {
    const loginRes = await loginAs('dm', '1234')
    const res = await request(app).post('/admin/players')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .send({ username: 'newguy', pin: '99' })
    expect(res.status).toBe(400)
  })
  it('creates player and returns 201 for DM', async () => {
    authService.prisma.user.findUnique.mockResolvedValue(null)
    const loginRes = await loginAs('dm', '1234')
    const res = await request(app).post('/admin/players')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .send({ username: 'newguy', pin: '4321' })
    expect(res.status).toBe(201)
  })
})

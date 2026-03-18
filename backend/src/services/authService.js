const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes (seconds)
const REFRESH_TOKEN_TTL = 7 * 24 * 3600; // 7 days (seconds)
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ── PIN hashing ─────────────────────────────────────────────────────────────

async function hashPIN(pin) {
  return bcrypt.hash(String(pin), SALT_ROUNDS);
}

async function comparePIN(pin, hash) {
  return bcrypt.compare(String(pin), hash);
}

// ── Lockout helpers ─────────────────────────────────────────────────────────

function isLockedOut(user) {
  if (!user.isLocked) return false;
  if (user.lockedUntil && new Date() > user.lockedUntil) {
    // Lockout has expired — unlock automatically on next successful login
    return false;
  }
  return true;
}

async function recordFailedAttempt(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const attempts = (user.failedAttempts || 0) + 1;
  const lock = attempts >= MAX_FAILED_ATTEMPTS;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedAttempts: attempts,
      isLocked: lock,
      lockedUntil: lock
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : user.lockedUntil,
    },
  });
}

async function clearFailedAttempts(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedAttempts: 0, isLocked: false, lockedUntil: null },
  });
}

// ── Token creation ──────────────────────────────────────────────────────────

function signAccessToken(payload) {
  return jwt.sign(
    { ...payload, jti: crypto.randomBytes(8).toString("hex") },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

async function issueTokens(user) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    username: user.username,
  });

  // Opaque refresh token stored in DB
  const rawRefresh = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);
  await prisma.refreshToken.create({
    data: { token: rawRefresh, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken: rawRefresh, expiresIn: ACCESS_TOKEN_TTL };
}

// ── Rotate refresh token ────────────────────────────────────────────────────

async function rotateRefreshToken(oldRawToken) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldRawToken },
  });

  if (!stored || stored.revoked || new Date() > stored.expiresAt) {
    throw Object.assign(new Error("Invalid or expired refresh token"), {
      status: 401,
    });
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw Object.assign(new Error("User not found"), { status: 401 });

  // Revoke old token and issue fresh pair (rotation)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  });
  const tokens = await issueTokens(user);
  return {
    ...tokens,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePIN: user.mustChangePIN,
    },
  };
}

// ── Full login flow ─────────────────────────────────────────────────────────

async function loginWithPIN(username, pin) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (!user) {
    // Constant-time dummy comparison to prevent username enumeration
    await bcrypt.compare(
      "0000",
      "$2b$12$invalidhashinvalid.invalidinvalidinval",
    );
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  if (isLockedOut(user)) {
    throw Object.assign(new Error("Account is locked"), { status: 423 });
  }

  const valid = await comparePIN(pin, user.pinHash);
  if (!valid) {
    await recordFailedAttempt(user.id);

    // Re-fetch to get updated count
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    if (updated.isLocked) {
      throw Object.assign(new Error("Account is locked"), { status: 423 });
    }
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  // Success — clear failed attempts (also auto-unlock expired lockout)
  await clearFailedAttempts(user.id);

  const tokens = await issueTokens(user);
  return {
    ...tokens,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePIN: user.mustChangePIN,
    },
  };
}

// ── Revoke a refresh token (logout) ────────────────────────────────────────

async function revokeRefreshToken(rawToken) {
  await prisma.refreshToken.updateMany({
    where: { token: rawToken, revoked: false },
    data: { revoked: true },
  });
}

// ── Change PIN ──────────────────────────────────────────────────────────────

async function changePIN(userId, newPin) {
  const hash = await hashPIN(newPin);
  await prisma.user.update({
    where: { id: userId },
    data: { pinHash: hash, mustChangePIN: false },
  });
}

// ── Username list for login selector ───────────────────────────────────────

async function getLoginUsernames() {
  const users = await prisma.user.findMany({
    select: { username: true },
    orderBy: { username: "asc" },
  });

  return users.map((u) => u.username);
}

module.exports = {
  hashPIN,
  loginWithPIN,
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  changePIN,
  getLoginUsernames,
  prisma,
};

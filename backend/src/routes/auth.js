const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  loginWithPIN,
  rotateRefreshToken,
  revokeRefreshToken,
  changePIN,
} = require("../services/authService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Tighter rate limit for login endpoint (5 attempts / 15 min per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === "test",
  skipSuccessfulRequests: true, // only count failures
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

// POST /auth/login
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { username, pin } = req.body;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ message: "Username is required" });
    }
    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    const result = await loginWithPIN(username.trim(), String(pin));

    // Refresh token in httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days ms
      path: "/auth/refresh",
    });

    res.json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh — uses httpOnly cookie
router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const result = await rotateRefreshToken(token);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/auth/refresh",
    });

    res.json({
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout — revoke refresh token
router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await revokeRefreshToken(token);
    res.clearCookie("refreshToken", { path: "/auth/refresh" });
    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
});

// POST /auth/change-pin — authenticated, required when mustChangePIN = true
router.post("/change-pin", requireAuth, async (req, res, next) => {
  try {
    const { newPin } = req.body;
    if (!newPin || !/^\d{4}$/.test(String(newPin))) {
      return res
        .status(400)
        .json({ message: "New PIN must be exactly 4 digits" });
    }
    await changePIN(req.user.id, String(newPin));
    res.json({ status: "ok", message: "PIN updated successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

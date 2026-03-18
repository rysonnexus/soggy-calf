const express = require("express");
const { requireAuth, requireDM } = require("../middleware/auth");
const { hashPIN, prisma } = require("../services/authService");

const router = express.Router();

// All admin routes require auth + DM role
router.use(requireAuth, requireDM);

// GET /admin/players — list all non-DM players
router.get("/players", async (req, res, next) => {
  try {
    const players = await prisma.user.findMany({
      where: { role: "PLAYER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        isLocked: true,
        lockedUntil: true,
        failedAttempts: true,
        mustChangePIN: true,
        createdAt: true,
      },
    });
    res.json(players);
  } catch (err) {
    next(err);
  }
});

// POST /admin/players — create a new player
router.post("/players", async (req, res, next) => {
  try {
    const { username, pin } = req.body;

    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length < 2
    ) {
      return res
        .status(400)
        .json({ message: "Username must be at least 2 characters" });
    }
    if (!pin || !/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    const normalized = username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { username: normalized },
    });
    if (existing) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const pinHash = await hashPIN(String(pin));
    const player = await prisma.user.create({
      data: {
        username: normalized,
        pinHash,
        role: "PLAYER",
        mustChangePIN: true,
        createdById: req.user.id,
      },
      select: {
        id: true,
        username: true,
        isLocked: true,
        failedAttempts: true,
        mustChangePIN: true,
        createdAt: true,
      },
    });

    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
});

// PATCH /admin/players/:id — reset PIN or lock/unlock
router.patch("/players/:id", async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id, 10);
    if (isNaN(playerId))
      return res.status(400).json({ message: "Invalid player ID" });

    const player = await prisma.user.findUnique({ where: { id: playerId } });
    if (!player || player.role !== "PLAYER") {
      return res.status(404).json({ message: "Player not found" });
    }

    const updateData = {};

    if (typeof req.body.isLocked === "boolean") {
      updateData.isLocked = req.body.isLocked;
      if (!req.body.isLocked) {
        // Unlock also resets failed attempts and lockout timer
        updateData.failedAttempts = 0;
        updateData.lockedUntil = null;
      }
    }

    if (req.body.pin !== undefined) {
      if (!/^\d{4}$/.test(String(req.body.pin))) {
        return res
          .status(400)
          .json({ message: "PIN must be exactly 4 digits" });
      }
      updateData.pinHash = await hashPIN(String(req.body.pin));
      updateData.mustChangePIN = true;
    }

    const updated = await prisma.user.update({
      where: { id: playerId },
      data: updateData,
      select: {
        id: true,
        username: true,
        isLocked: true,
        lockedUntil: true,
        failedAttempts: true,
        mustChangePIN: true,
        createdAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /admin/players/:id
router.delete("/players/:id", async (req, res, next) => {
  try {
    const playerId = parseInt(req.params.id, 10);
    if (isNaN(playerId))
      return res.status(400).json({ message: "Invalid player ID" });

    const player = await prisma.user.findUnique({ where: { id: playerId } });
    if (!player || player.role !== "PLAYER") {
      return res.status(404).json({ message: "Player not found" });
    }

    await prisma.user.delete({ where: { id: playerId } });
    res.json({ status: "ok", message: "Player removed" });
  } catch (err) {
    next(err);
  }
});

// GET /admin/campaigns — list campaigns created by current DM
router.get("/campaigns", async (req, res, next) => {
  try {
    const campaigns = await prisma.$queryRaw`
      SELECT id, name, description, "createdAt"
      FROM "Campaign"
      WHERE "createdById" = ${req.user.id}
      ORDER BY "createdAt" DESC
    `;
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
});

// POST /admin/campaigns — create a campaign
router.post("/campaigns", async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Campaign name must be at least 2 characters" });
    }

    const normalizedDescription =
      typeof description === "string" && description.trim()
        ? description.trim()
        : null;

    const rows = await prisma.$queryRaw`
      INSERT INTO "Campaign" (name, description, "createdById", "updatedAt")
      VALUES (${name.trim()}, ${normalizedDescription}, ${req.user.id}, NOW())
      RETURNING id, name, description, "createdAt"
    `;

    const campaign = rows[0];

    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

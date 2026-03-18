require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");
const { prisma } = require("./services/authService");

const app = express();
const DB_CONNECT_MAX_ATTEMPTS = 20;
const DB_CONNECT_RETRY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectDatabaseWithRetry() {
  let lastError = null;

  for (let attempt = 1; attempt <= DB_CONNECT_MAX_ATTEMPTS; attempt += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      lastError = err;
      console.error(
        `[startup] Database connection failed (attempt ${attempt}/${DB_CONNECT_MAX_ATTEMPTS}). Retrying in ${DB_CONNECT_RETRY_MS}ms...`,
      );
      await sleep(DB_CONNECT_RETRY_MS);
    }
  }

  throw lastError;
}

async function isDatabaseReady() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// ── Security: trust proxy for rate-limit IP detection behind Docker/nginx ──
app.set("trust proxy", 1);

// ── CORS ──
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);

// ── Body parsing ──
app.use(express.json());
app.use(cookieParser());

// ── Global rate limit (100 req/15 min per IP) ──
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: () => process.env.NODE_ENV === "test",
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  }),
);

// ── Routes ──
app.get("/", (_req, res) =>
  res.json({
    status: "ok",
    app: "Waterdeep: Dragon Heist API",
    docs: ["/health", "/auth/*", "/admin/*", "/api/auth/*", "/api/admin/*"],
  }),
);
app.get("/health", async (_req, res) => {
  const dbReady = await isDatabaseReady();

  if (!dbReady) {
    return res
      .status(503)
      .json({ status: "degraded", app: "Waterdeep: Dragon Heist", db: "down" });
  }

  return res.json({ status: "ok", app: "Waterdeep: Dragon Heist", db: "up" });
});
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
// Support both direct backend calls (/auth, /admin) and proxied calls (/api/*)
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 ──
app.use((_req, res) => res.status(404).json({ message: "Not found" }));

// ── Global error handler ──
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  (async () => {
    try {
      await connectDatabaseWithRetry();
      app.listen(PORT, () => {
        console.log(
          `[soggy-calf] backend running on port ${PORT} (${process.env.NODE_ENV || "development"})`,
        );
      });
    } catch (err) {
      console.error("[startup] Could not connect to database.", err);
      process.exit(1);
    }
  })();
}

module.exports = app;

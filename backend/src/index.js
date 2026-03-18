require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");

const app = express();

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
    app: "The Soggy Calf API",
    docs: ["/health", "/auth/*", "/admin/*", "/api/auth/*", "/api/admin/*"],
  }),
);
app.get("/health", (_req, res) =>
  res.json({ status: "ok", app: "The Soggy Calf" }),
);
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
  app.listen(PORT, () => {
    console.log(
      `[soggy-calf] backend running on port ${PORT} (${process.env.NODE_ENV || "development"})`,
    );
  });
}

module.exports = app;

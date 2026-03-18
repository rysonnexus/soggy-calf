const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      username: payload.username,
    };
    next();
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ message: msg });
  }
}

function requireDM(req, res, next) {
  if (!req.user || req.user.role !== "DM") {
    return res.status(403).json({ message: "Dungeon Master access required" });
  }
  next();
}

module.exports = { requireAuth, requireDM };

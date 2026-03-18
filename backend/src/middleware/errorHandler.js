function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = status < 500 ? err.message : "Internal server error";

  if (status >= 500) {
    console.error("[error]", err);
  }

  res.status(status).json({ message });
}

module.exports = errorHandler;

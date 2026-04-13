require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { PORT, FRONTEND_URL, NODE_ENV } = require("./src/config/env");

// ── Core middleware ────────────────────────────────────────────────────────────
const apiLimiter      = require("./src/middleware/rateLimiter");
const errorHandler    = require("./src/middleware/errorHandler");
const systemMiddleware = require("./src/middleware/systemMiddleware");

// ── Route modules ──────────────────────────────────────────────────────────────
const authRoutes     = require("./src/routes/authRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const threadRoutes   = require("./src/routes/threadRoutes");
const commentRoutes  = require("./src/routes/commentRoutes");
const voteRoutes     = require("./src/routes/voteRoutes");
const reportRoutes   = require("./src/routes/reportRoutes");
const adminRoutes    = require("./src/routes/adminRoutes");

const app = express();

// Trust the first proxy hop (required on Render — sits behind a load balancer).
// Without this, express-rate-limit sees every request as the same internal IP,
// making IP-based limiting useless in production.
app.set('trust proxy', 1);

// Configure CORS
const corsOptions = {
  origin: NODE_ENV === 'production' ? FRONTEND_URL : '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(apiLimiter);

connectDB();

// System-level gate runs before every /api route (maintenance mode, guest access checks)
app.use("/api", systemMiddleware);

app.use("/api/auth",       authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/threads",    threadRoutes);
app.use("/api/comments",   commentRoutes);
app.use("/api/votes",      voteRoutes);
app.use("/api/reports",    reportRoutes);
app.use("/api/admin",      adminRoutes);

// Centralised error handler — must be registered after all routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
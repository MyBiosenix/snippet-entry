const express = require("express");
const cors = require("cors");

const adminAuthRoutes = require("./routes/adminAuthRoutes");
const userAuthRoutes = require("./routes/userAuthRoutes");
const packageRoutes = require("./routes/packageRoutes");
const snippetRoutes = require("./routes/snipetRoutes");
const subadminRoutes = require("./routes/subadminRoutes");
const env = require("./config/env");

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://freelancing-project.com",
    "https://www.freelancing-project.com",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    appEnv: env.appEnv,
    time: new Date().toISOString(),
  });
});

app.use("/api/admin", adminAuthRoutes);
app.use("/api/auth", userAuthRoutes);
app.use("/api/package", packageRoutes);
app.use("/api/snippet", snippetRoutes);
app.use("/api/sub-admin", subadminRoutes);

module.exports = app;
const express = require("express");
const cors = require("cors");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const userAuthRoutes = require("./routes/userAuthRoutes");
const packageRoutes = require("./routes/packageRoutes");
const snippetRoutes = require("./routes/snipetRoutes");
const subadminRoutes = require("./routes/subadminRoutes");
const env = require("./config/env");

const app = express();

const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin and non-browser requests such as health checks/curl.
    if (!origin) {
      return callback(null, true);
    }

    if (env.corsAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
};

app.use(cors(corsOptions));
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

app.use((error, _req, res, next) => {
  if (!error) {
    return next();
  }

  if (error.message?.startsWith("CORS blocked for origin:")) {
    return res.status(403).json({
      message: "Origin is not allowed by CORS policy",
    });
  }

  return next(error);
});

module.exports = app;

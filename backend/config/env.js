const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const appEnv = process.env.APP_ENV || "local";
const dbMode = process.env.DB_MODE || appEnv;

const isProductionApp = appEnv === "production";
const isProductionDB = dbMode === "production";

const port =
  Number(isProductionApp ? process.env.PROD_PORT : process.env.LOCAL_PORT) ||
  5098;

const mongoUri = isProductionDB
  ? process.env.PROD_MONGODB_URI
  : process.env.LOCAL_MONGODB_URI;

if (!mongoUri) {
  throw new Error(
    `Missing MongoDB URI for DB_MODE="${dbMode}". Expected ${
      isProductionDB ? "PROD_MONGODB_URI" : "LOCAL_MONGODB_URI"
    } in backend/.env`
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in backend/.env");
}

const env = {
  appEnv,
  dbMode,
  isProductionApp,
  isProductionDB,
  port,
  mongoUri,
  jwtSecret: process.env.JWT_SECRET,
};

module.exports = env;

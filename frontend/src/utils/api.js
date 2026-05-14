const appEnv = import.meta.env.VITE_APP_ENV || "local";

export const API_BASE =
  appEnv === "production"
    ? import.meta.env.VITE_PROD_API_BASE_URL ||
      "https://api.freelancing-project.com/api"
    : import.meta.env.VITE_LOCAL_API_BASE_URL || "http://localhost:5098/api";

export const API_BASE_URL = API_BASE;

export default API_BASE;

import axios from "axios";
import { API_BASE } from "./api";

const resolveTokenForPath = (pathname = "") => {
  if (pathname.startsWith("/admin")) {
    return (
      localStorage.getItem("adminToken") || localStorage.getItem("token") || ""
    );
  }

  if (pathname.startsWith("/sub-admin")) {
    return (
      localStorage.getItem("subAdminToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }

  return (
    localStorage.getItem("userToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("subAdminToken") ||
    ""
  );
};

const http = axios.create({
  baseURL: API_BASE,
});

const attachToken = (config) => {
  const token = resolveTokenForPath(window.location.pathname);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

http.interceptors.request.use(
  (config) => attachToken(config),
  (error) => Promise.reject(error)
);

axios.interceptors.request.use(
  (config) => attachToken(config),
  (error) => Promise.reject(error)
);

export default http;

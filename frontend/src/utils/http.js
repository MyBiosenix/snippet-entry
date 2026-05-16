import axios from "axios";
import { API_BASE } from "./api";
import { clearAdminSession, clearSubAdminSession } from "./auth";

const resolveTokenForPath = (pathname = "") => {
  if (pathname.startsWith("/admin")) {
    return localStorage.getItem("adminToken") || "";
  }

  if (pathname.startsWith("/sub-admin")) {
    return localStorage.getItem("subAdminToken") || "";
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

const handleUnauthorizedSession = (error) => {
  if (error?.response?.status !== 401) {
    return Promise.reject(error);
  }

  const pathname = window.location.pathname;

  if (pathname.startsWith("/admin")) {
    clearAdminSession();
    window.location.replace("/admin/login");
    return Promise.reject(error);
  }

  if (pathname.startsWith("/sub-admin")) {
    clearSubAdminSession();
    window.location.replace("/sub-admin/login");
  }

  return Promise.reject(error);
};

http.interceptors.response.use((response) => response, handleUnauthorizedSession);
axios.interceptors.response.use(
  (response) => response,
  handleUnauthorizedSession
);

export default http;

import axios from "axios";
import { API_BASE } from "./api";

const http = axios.create({
  baseURL: API_BASE,
});

http.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("userToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("subAdminToken");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default http;

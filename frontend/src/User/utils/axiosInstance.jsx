import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5098/api", // your backend base URL
});

// ✅ Automatically add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Global response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto logout if token expired or invalid
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

import http from "../../utils/http";
import { clearUserSession } from "../../utils/auth";

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearUserSession();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default http;

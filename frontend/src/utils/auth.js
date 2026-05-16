export const getUserToken = () =>
  localStorage.getItem("userToken") || localStorage.getItem("token") || "";

export const getAdminToken = () => localStorage.getItem("adminToken") || "";

export const getSubAdminToken = () =>
  localStorage.getItem("subAdminToken") || "";

export const getStaffToken = (pathname = "") => {
  if (pathname.startsWith("/sub-admin")) {
    return getSubAdminToken();
  }

  return getAdminToken();
};

export const getStoredUserId = () => {
  const directUserId = localStorage.getItem("userId");
  if (directUserId) return directUserId;

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user._id || user.id || "";
  } catch {
    return "";
  }
};

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "="
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 <= Date.now();
};

export const isUserSessionValid = () => {
  const token = getUserToken();
  const userData = localStorage.getItem("user");
  const userId = localStorage.getItem("userId");

  return Boolean(token && userData && userId) && !isTokenExpired(token);
};

export const clearUserSession = () => {
  const userToken = localStorage.getItem("userToken");

  localStorage.removeItem("user");
  localStorage.removeItem("userToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("isActive");

  if (localStorage.getItem("token") === userToken) {
    localStorage.removeItem("token");
  }
};

export const isAdminSessionValid = () => {
  const token = getAdminToken();
  const adminData = localStorage.getItem("admin");

  return Boolean(token && adminData) && !isTokenExpired(token);
};

export const isSubAdminSessionValid = () => {
  const token = getSubAdminToken();
  const subAdminData = localStorage.getItem("subadmin");

  return Boolean(token && subAdminData) && !isTokenExpired(token);
};

export const clearAdminSession = () => {
  const adminToken = localStorage.getItem("adminToken");

  localStorage.removeItem("admin");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminId");

  if (localStorage.getItem("token") === adminToken) {
    localStorage.removeItem("token");
  }
};

export const clearSubAdminSession = () => {
  const subAdminToken = localStorage.getItem("subAdminToken");

  localStorage.removeItem("subadmin");
  localStorage.removeItem("subAdminToken");
  localStorage.removeItem("adminId");

  if (localStorage.getItem("token") === subAdminToken) {
    localStorage.removeItem("token");
  }
};

export const storeAdminSession = ({ token, admin }) => {
  localStorage.setItem("adminToken", token);
  localStorage.setItem("token", token);
  localStorage.setItem("admin", JSON.stringify(admin));
  localStorage.setItem("adminId", admin.id);
};

export const storeSubAdminSession = ({ token, subadmin }) => {
  localStorage.setItem("subAdminToken", token);
  localStorage.setItem("token", token);
  localStorage.setItem("subadmin", JSON.stringify(subadmin));
  localStorage.setItem("adminId", subadmin.id);
};

export const storeUserSession = ({ token, user }) => {
  localStorage.setItem("userToken", token);
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));

  const storedUserId = user._id || user.id;
  if (storedUserId) {
    localStorage.setItem("userId", storedUserId);
  }

  if (typeof user.isActive !== "undefined") {
    localStorage.setItem("isActive", String(user.isActive));
  }
};

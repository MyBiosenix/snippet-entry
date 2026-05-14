export const getUserToken = () =>
  localStorage.getItem("userToken") || localStorage.getItem("token") || "";

export const getAdminToken = () =>
  localStorage.getItem("adminToken") || localStorage.getItem("token") || "";

export const getSubAdminToken = () =>
  localStorage.getItem("subAdminToken") || localStorage.getItem("token") || "";

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

function normalizePackageName(name = "") {
  return String(name || "").trim().toLowerCase();
}

function getPackagePageLimit(pkg) {
  const pageCount = Number(pkg?.pages);
  if (Number.isFinite(pageCount) && pageCount > 0) {
    return pageCount;
  }

  const packageName = normalizePackageName(pkg?.name);

  if (["vip", "vpi", "diamond", "dimand"].includes(packageName)) {
    return 200;
  }

  if (packageName === "gold") {
    return 100;
  }

  return 100;
}

function hasTargetAchieved(pkg, currentIndex = 0) {
  const packageName = normalizePackageName(pkg?.name);
  const progress = Number(currentIndex) || 0;

  if (packageName === "gold") {
    return progress >= 75;
  }

  if (["vip", "vpi", "diamond", "dimand"].includes(packageName)) {
    return progress >= 150;
  }

  return false;
}

module.exports = {
  getPackagePageLimit,
  hasTargetAchieved,
  normalizePackageName,
};

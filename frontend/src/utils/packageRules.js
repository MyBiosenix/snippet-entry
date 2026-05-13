export function getPackagePageLimit(pkg) {
  const pageCount = Number(pkg?.pages);
  if (Number.isFinite(pageCount) && pageCount > 0) {
    return pageCount;
  }

  const packageName = String(pkg?.name || "").trim().toLowerCase();

  if (["vip", "vpi", "diamond", "dimand"].includes(packageName)) {
    return 200;
  }

  return 100;
}

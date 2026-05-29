function clampLimit(limit, fallback = 10, max = 100) {
  const parsed = Number(limit);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.trunc(parsed), max);
}

function clampPage(page, fallback = 1) {
  const parsed = Number(page);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePaginationQuery(query = {}, options = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    maxLimit = 100,
    defaultSortBy = "date",
    defaultSortOrder = "desc",
    allowedSortFields = [],
  } = options;

  const page = clampPage(query.page, defaultPage);
  const limit = clampLimit(query.limit, defaultLimit, maxLimit);
  const rawSortBy = String(query.sortBy || defaultSortBy);
  const sortBy = allowedSortFields.includes(rawSortBy) ? rawSortBy : defaultSortBy;
  const sortOrder = String(query.sortOrder || defaultSortOrder).toLowerCase() === "asc" ? "asc" : "desc";
  const search = String(query.search || "").trim();

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder,
    search,
  };
}

function buildPagination(page, limit, total) {
  const safeTotal = Number(total) || 0;
  const totalPages = safeTotal > 0 ? Math.ceil(safeTotal / limit) : 0;

  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
  };
}

function buildPaginatedResponse(data, page, limit, total) {
  return {
    data,
    pagination: buildPagination(page, limit, total),
  };
}

module.exports = {
  escapeRegex,
  parsePaginationQuery,
  buildPagination,
  buildPaginatedResponse,
};

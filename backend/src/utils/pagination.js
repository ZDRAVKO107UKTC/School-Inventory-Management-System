'use strict';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const resolvePagination = (query = {}, options = {}) => {
  if (query.paginate === 'false') {
    return null;
  }

  const shouldPaginate = query.paginate === 'true' || query.page !== undefined || query.limit !== undefined;
  if (!shouldPaginate) {
    return null;
  }

  const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;
  const limit = Math.min(parsePositiveInteger(query.limit, defaultLimit), maxLimit);

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
};

const buildPaginationMeta = (totalItems, pagination) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));

  return {
    page: pagination.page,
    limit: pagination.limit,
    totalItems,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1
  };
};

const applyPaginationHeaders = (res, meta) => {
  res.set({
    'X-Page': String(meta.page),
    'X-Limit': String(meta.limit),
    'X-Total-Count': String(meta.totalItems),
    'X-Total-Pages': String(meta.totalPages)
  });
};

module.exports = {
  resolvePagination,
  buildPaginationMeta,
  applyPaginationHeaders
};

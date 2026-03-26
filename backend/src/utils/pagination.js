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

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} paginationMeta - Pagination metadata
 * @param {Object} options - { statusCode = 200, message = null }
 */
const sendPaginatedResponse = (res, data, paginationMeta, options = {}) => {
  const { statusCode = 200, message = null } = options;
  
  applyPaginationHeaders(res, paginationMeta);
  
  const response = {
    success: true,
    data,
    pagination: {
      page: paginationMeta.page,
      limit: paginationMeta.limit,
      totalItems: paginationMeta.totalItems,
      totalPages: paginationMeta.totalPages,
      hasNextPage: paginationMeta.hasNextPage,
      hasPreviousPage: paginationMeta.hasPreviousPage,
    },
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send unpaginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} options - { statusCode = 200, message = null }
 */
const sendUnpaginatedResponse = (res, data, options = {}) => {
  const { statusCode = 200, message = null } = options;

  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  resolvePagination,
  buildPaginationMeta,
  applyPaginationHeaders,
  sendPaginatedResponse,
  sendUnpaginatedResponse,
};

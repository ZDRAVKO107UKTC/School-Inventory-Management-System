'use strict';

const fs = require('fs');
const crypto = require('crypto');

const GOOGLE_TOKEN_AUDIENCE = 'https://oauth2.googleapis.com/token';
const TOKEN_SAFETY_WINDOW_MS = 60 * 1000;
const accessTokenCache = new Map();

const SERVICE_ACCOUNT_SOURCES = [
  {
    json: 'GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON',
    email: 'GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL',
    privateKey: 'GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY',
    projectId: 'GOOGLE_SHEETS_SERVICE_ACCOUNT_PROJECT_ID'
  },
  {
    json: 'GOOGLE_SERVICE_ACCOUNT_JSON',
    email: 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    privateKey: 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    projectId: 'GOOGLE_SERVICE_ACCOUNT_PROJECT_ID'
  }
];

const base64UrlEncode = (value) => Buffer.from(value)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const normalizePrivateKey = (value) => {
  if (!value) return null;
  return String(value).replace(/\\n/g, '\n');
};

const tryParseJson = (value) => {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    // continue
  }

  if (fs.existsSync(trimmed)) {
    return JSON.parse(fs.readFileSync(trimmed, 'utf8'));
  }

  try {
    return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
  } catch (_error) {
    return null;
  }
};

const getConfigFromSource = (source) => {
  const jsonConfig = tryParseJson(process.env[source.json]);
  if (jsonConfig?.client_email && jsonConfig?.private_key) {
    return {
      projectId: jsonConfig.project_id || null,
      clientEmail: jsonConfig.client_email,
      privateKey: normalizePrivateKey(jsonConfig.private_key)
    };
  }

  if (process.env[source.email] && process.env[source.privateKey]) {
    return {
      projectId: process.env[source.projectId] || null,
      clientEmail: process.env[source.email],
      privateKey: normalizePrivateKey(process.env[source.privateKey])
    };
  }

  return null;
};

const getGoogleServiceAccountConfig = () => {
  for (const source of SERVICE_ACCOUNT_SOURCES) {
    const config = getConfigFromSource(source);
    if (config?.clientEmail && config?.privateKey) {
      return config;
    }
  }

  return null;
};

const isGoogleServiceAccountConfigured = () => Boolean(getGoogleServiceAccountConfig());

const buildSignedJwt = ({ clientEmail, privateKey, scopes }) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: scopes.join(' '),
    aud: GOOGLE_TOKEN_AUDIENCE,
    iat: issuedAt,
    exp: expiresAt
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${unsignedToken}.${signature}`;
};

const getGoogleAccessToken = async (scopes) => {
  const serviceAccount = getGoogleServiceAccountConfig();
  if (!serviceAccount) {
    throw new Error('Google Sheets service account is not configured');
  }

  const normalizedScopes = Array.isArray(scopes) ? scopes.filter(Boolean).sort() : [];
  if (normalizedScopes.length === 0) {
    throw new Error('At least one Google API scope is required');
  }

  const cacheKey = `${serviceAccount.clientEmail}:${normalizedScopes.join(' ')}`;
  const cachedToken = accessTokenCache.get(cacheKey);

  if (cachedToken && cachedToken.expiresAt - TOKEN_SAFETY_WINDOW_MS > Date.now()) {
    return cachedToken.accessToken;
  }

  const assertion = buildSignedJwt({
    clientEmail: serviceAccount.clientEmail,
    privateKey: serviceAccount.privateKey,
    scopes: normalizedScopes
  });

  const response = await fetch(GOOGLE_TOKEN_AUDIENCE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'Failed to obtain Google access token');
  }

  const expiresInMs = Number(payload.expires_in || 3600) * 1000;
  accessTokenCache.set(cacheKey, {
    accessToken: payload.access_token,
    expiresAt: Date.now() + expiresInMs
  });

  return payload.access_token;
};

module.exports = {
  getGoogleServiceAccountConfig,
  getGoogleAccessToken,
  isGoogleServiceAccountConfigured
};

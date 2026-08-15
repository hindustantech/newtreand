'use client';

const CSRF_COOKIE = 'satrang_csrf';

function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)satrang_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function ensureCsrfToken() {
  let token = getCsrfToken();
  if (!token) {
    token = `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    document.cookie = `${CSRF_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  }
  return token;
}

export async function apiFetch(url, options = {}) {
  const body = options.body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (!isFormData && body != null) {
    headers['Content-Type'] = 'application/json';
  }

  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    headers['x-csrf-token'] = ensureCsrfToken();
  }

  const res = await fetch(url, { ...options, method, headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

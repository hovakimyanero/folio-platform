import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://folio-platform-folio.up.railway.app/api';

let accessToken = null;
let refreshToken = null;

export async function loadTokens() {
  accessToken = await SecureStore.getItemAsync('accessToken');
  refreshToken = await SecureStore.getItemAsync('refreshToken');
}

export async function saveTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) await SecureStore.setItemAsync('accessToken', access);
  else await SecureStore.deleteItemAsync('accessToken');
  if (refresh) await SecureStore.setItemAsync('refreshToken', refresh);
  else await SecureStore.deleteItemAsync('refreshToken');
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}

export function getAccessToken() {
  return accessToken;
}

async function tryRefresh() {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      await saveTokens(data.accessToken, data.refreshToken || refreshToken);
      return true;
    }
  } catch {}
  return false;
}

export async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };

  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  return res;
}

export async function apiJson(path, options = {}) {
  const res = await api(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || 'Ошибка запроса');
  }
  return res.json();
}

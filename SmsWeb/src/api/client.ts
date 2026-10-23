import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Clear the session and send the user to login with a reason flag (avoids a silent redirect). */
function forceLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login?expired=1';
  }
}

// A single in-flight refresh shared by all requests. The backend ROTATES
// (deletes + recreates) the refresh token on every use, so firing several
// refreshes at once makes it delete the same row twice → StaleObjectState.
let refreshPromise: Promise<string> | null = null;

function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));
  return axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken }).then((res) => {
    const payload = res.data?.data ?? res.data;
    const accessToken = payload?.accessToken;
    const rotatedRefresh = payload?.refreshToken;
    if (!accessToken) throw new Error('No access token in refresh response');
    localStorage.setItem('accessToken', accessToken);
    if (rotatedRefresh) localStorage.setItem('refreshToken', rotatedRefresh);
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return accessToken as string;
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Backend returns 403 (not 401) for an expired JWT, so attempt a token
    // refresh on either status. A genuine role-403 will simply 403 again after
    // the retry and be rejected — no logout, no loop (guarded by _retry).
    const status = error.response?.status;
    if ((status === 401 || status === 403) && original && !original._retry) {
      original._retry = true;
      if (!localStorage.getItem('refreshToken')) {
        forceLogout();
        return Promise.reject(error);
      }
      try {
        // Reuse the in-flight refresh if one is already running.
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
        }
        const accessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        forceLogout();
      }
    }
    return Promise.reject(error);
  }
);

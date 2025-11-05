// Read from env (Vite): define VITE_API_BASE_URL in Vercel. Fallback to local dev.
const RAW_BASE = import.meta?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_BASE_URL = RAW_BASE.replace(/\/$/, '');

/** Generic fetch wrapper that returns parsed JSON or throws. */
export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Fetch carousel images (public endpoint). Returns array or empty array. */
export async function fetchCarouselImages() {
  try {
    const url = `${API_BASE_URL}/carousel-images/`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(item => item.is_active).sort((a,b) => (a.position||0)-(b.position||0));
  } catch (e) {
    console.error('fetchCarouselImages error', e);
    return [];
  }
}

/** Example authenticated fetch for boards */
export async function fetchBoards(token) {
  if (!token) return [];
  const url = `${API_BASE_URL}/boards/`;
  return fetchJson(url, { headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` } });
}

export default { fetchJson, fetchCarouselImages, fetchBoards };

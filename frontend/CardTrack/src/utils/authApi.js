const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/users/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function register(name, email, password) {
  const res = await fetch(`${API_BASE_URL}/users/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Register failed');
  return data;
}

export async function getMe(token) {
  if (!token) throw new Error('No token');
  const res = await fetch(`${API_BASE_URL}/users/me/`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
  return data;
}

export async function changePassword(token, userId, current_password, new_password) {
  if (!token) throw new Error('No token');
  const res = await fetch(`${API_BASE_URL}/users/${userId}/change-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
    body: JSON.stringify({ current_password, new_password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // prefer 'detail' or 'message' or fallback
    const err = data.detail || data.message || JSON.stringify(data) || 'Failed to change password';
    throw new Error(err);
  }
  return data;
}

export default { login, register, getMe };

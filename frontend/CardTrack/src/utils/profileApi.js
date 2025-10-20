const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function updateUser(userId, token, formData) {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Token ${token}`,
    },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Failed to update user');
  return data;
}

export default { updateUser };

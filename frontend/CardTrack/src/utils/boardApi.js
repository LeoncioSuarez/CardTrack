const API_BASE = 'http://127.0.0.1:8000/api';

async function _request(path, opts = {}) {
	const url = `${API_BASE}${path}`;
	const res = await fetch(url, opts);
	const text = await res.text();
	let data = null;
	try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
	if (!res.ok) {
		const err = new Error((data && (data.detail || data.error)) || res.statusText || 'HTTP error');
		err.status = res.status;
		err.body = data;
		throw err;
	}
	return data;
}

function _authHeaders(token) {
	return token ? { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` } : { 'Content-Type': 'application/json' };
}

export async function createBoard(title, token, columns = []) {
	// create board then create columns sequentially
	const board = await _request('/boards/', {
		method: 'POST',
		headers: _authHeaders(token),
		body: JSON.stringify({ title, description: '' }),
	});
	// create columns
	if (Array.isArray(columns) && columns.length) {
		await Promise.all(columns.map((col, idx) => _request(`/boards/${board.id}/columns/`, {
			method: 'POST',
			headers: _authHeaders(token),
			body: JSON.stringify({ title: col, position: idx }),
		})));
	}
	return board;
}

export async function getBoard(boardId, token) {
	return _request(`/boards/${boardId}/`, { headers: _authHeaders(token) });
}

export async function getColumns(boardId, token) {
	return _request(`/boards/${boardId}/columns/`, { headers: _authHeaders(token) });
}

export async function getMembers(boardId, token) {
	const members = await _request(`/boards/${boardId}/members/`, { headers: _authHeaders(token) });
	// If API returns only user IDs in 'user', fetch user details to display name/email/profile
	const augmented = await Promise.all(members.map(async (m) => {
		try {
			if (m && (typeof m.user === 'number' || (typeof m.user === 'string' && m.user.match(/^\d+$/)))) {
				const uid = Number(m.user);
				const user = await _request(`/users/${uid}/`, { headers: _authHeaders(token) });
				return {
					...m,
					user_name: user.name || user.id || '',
					user_email: user.email || '',
					user_profilepicture: user.profilepicture || user.profile_picture || null,
				};
			}
		} catch (err) {
			// ignore per-user fetch errors and return original membership
		}
		return m;
	}));
	return augmented;
}

export async function inviteByEmail(boardId, token, email, role = 'viewer') {
	return _request(`/boards/${boardId}/invite/`, {
		method: 'POST',
		headers: _authHeaders(token),
		body: JSON.stringify({ email, role }),
	});
}

export async function updateMemberRole(boardId, memberId, token, role) {
	return _request(`/boards/${boardId}/members/${memberId}/`, {
		method: 'PATCH',
		headers: _authHeaders(token),
		body: JSON.stringify({ role }),
	});
}

export default { createBoard, getBoard, getColumns, getMembers, inviteByEmail, updateMemberRole };

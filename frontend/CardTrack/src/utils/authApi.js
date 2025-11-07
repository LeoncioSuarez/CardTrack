const API_BASE = 'http://127.0.0.1:8000/api';

async function _request(path, opts = {}) {
	const url = `${API_BASE}${path}`;
	try {
		const res = await fetch(url, opts);
		const text = await res.text();
		let data = null;
		try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
		if (!res.ok) {
			const err = new Error((data && (data.detail || data.error)) || res.statusText || 'HTTP error');
			err.status = res.status;
			err.body = data;
			throw err;
		}
		return data;
	} catch (err) {
		// Network errors will be TypeError from fetch; normalize
		if (!err.status) {
			const e2 = new Error('Network error');
			e2.status = null;
			throw e2;
		}
		throw err;
	}
}

export async function login(email, password) {
	return _request('/users/login/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});
}

export async function register(name, email, password) {
	return _request('/users/register/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, email, password }),
	});
}

export async function getMe(token) {
	if (!token) {
		const err = new Error('No token'); err.status = 401; throw err;
	}
	return _request('/users/me/', {
		method: 'GET',
		headers: { 'Authorization': `Token ${token}` },
	});
}

export default { login, register, getMe };

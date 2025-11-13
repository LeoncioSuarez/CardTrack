import { fetchJson } from './api';

// Base API URL (strip trailing slash). Prefer VITE_API_BASE_URL in the environment.
const RAW_BASE = import.meta?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_BASE_URL = RAW_BASE.replace(/\/$/, '');

// Helper to build authorization + content headers
const authHeaders = (token) => ({ 'Content-Type': 'application/json', 'Authorization': `Token ${token}` });

// =====================================================================
// Board API - exported functions (alphabetical order)
// Each function returns a promise and throws a localized Error on non-OK responses
// =====================================================================

/**
 * Create a new board and optional initial columns.
 * @param {string} boardName
 * @param {string} token
 * @param {string[]} columns - optional list of column titles
 * @returns {Promise<Object>} created board
 */
export async function createBoard(boardName, token, columns = []) {
  const res = await fetch(`${API_BASE_URL}/boards/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title: boardName, description: '' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No se pudo crear el tablero');
  }
  const board = await res.json();

  // create columns in parallel (best-effort)
  const colRequests = columns.map((title, index) =>
    createColumn(board.id, token, title, '#007ACF', index)
  );
  await Promise.all(colRequests);
  return board;
}

/** Create a card inside a column */
export async function createCard(boardId, token, columnId, title, description, position) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, description, position }),
  });
  if (!res.ok) throw new Error('No se pudo crear la tarea');
  return res.json();
}

/** Create a column inside a board */
export async function createColumn(boardId, token, title, color, position) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, position, color }),
  });
  if (!res.ok) throw new Error('No se pudo crear la columna');
  return res.json();
}

/** Delete a board */
export async function deleteBoard(boardId, token) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar el tablero');
  return true;
}

/** Delete a card */
export async function deleteCard(boardId, token, columnId, cardId) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar la tarea');
  return true;
}

/** Delete a column */
export async function deleteColumn(boardId, token, columnId) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar la columna');
  return true;
}

/** Get a single board (uses fetchJson helper) */
export async function getBoard(boardId, token) {
  return fetchJson(`${API_BASE_URL}/boards/${boardId}/`, { headers: authHeaders(token) });
}

/** Get all columns for a board (uses fetchJson helper) */
export async function getColumns(boardId, token) {
  return fetchJson(`${API_BASE_URL}/boards/${boardId}/columns/`, { headers: authHeaders(token) });
}

/** Get board members */
export async function getMembers(boardId, token) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/members/`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('No se pudo obtener los miembros');
  return res.json();
}

/** Invite a user by email to a board */
export async function inviteByEmail(boardId, token, email, role = 'viewer') {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/members/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || (err.email ? err.email.join(', ') : 'No se pudo invitar al usuario'));
  }
  return res.json();
}

/** Leave a board (current user) */
export async function leaveBoard(boardId, token) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/leave/`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No se pudo abandonar el tablero');
  }
  return true;
}

/** Update a card */
export async function updateCard(boardId, token, columnId, cardId, payload) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo actualizar la tarea');
  return res.json();
}

/** Update a column */
export async function updateColumn(boardId, token, columnId, payload) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo actualizar la columna');
  return res.json();
}

/** Update a member's role */
export async function updateMemberRole(boardId, memberId, token, role) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/members/${memberId}/`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No se pudo actualizar el rol');
  }
  return res.json();
}

// Default export: named exports are preferred, but keep default for backwards compatibility
export default {
  createBoard,
  createCard,
  createColumn,
  deleteBoard,
  deleteCard,
  deleteColumn,
  getBoard,
  getColumns,
  getMembers,
  inviteByEmail,
  leaveBoard,
  updateCard,
  updateColumn,
  updateMemberRole,
};

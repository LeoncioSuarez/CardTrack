import { fetchJson } from './api';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const authHeaders = (token) => ({ 'Content-Type': 'application/json', 'Authorization': `Token ${token}` });

export async function getBoard(boardId, token) {
  return fetchJson(`${API_BASE_URL}/boards/${boardId}/`, { headers: authHeaders(token) });
}

export async function getColumns(boardId, token) {
  return fetchJson(`${API_BASE_URL}/boards/${boardId}/columns/`, { headers: authHeaders(token) });
}

export async function createColumn(boardId, token, title, color, position) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, position, color }),
  });
  if (!res.ok) throw new Error('No se pudo crear la columna');
  return res.json();
}

export async function createBoard(boardName, token, columns = []) {
  const res = await fetch(`${API_BASE_URL}/boards/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
    body: JSON.stringify({ title: boardName, description: '' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'No se pudo crear el tablero');
  }
  const board = await res.json();
  // create columns
  const colRequests = columns.map((title, index) =>
    createColumn(board.id, token, title, '#007ACF', index)
  );
  await Promise.all(colRequests);
  return board;
}

export async function updateColumn(boardId, token, columnId, payload) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo actualizar la columna');
  return res.json();
}

export async function deleteColumn(boardId, token, columnId) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar la columna');
  return true;
}

export async function createCard(boardId, token, columnId, title, description, position) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, description, position }),
  });
  if (!res.ok) throw new Error('No se pudo crear la tarea');
  return res.json();
}

export async function updateCard(boardId, token, columnId, cardId, payload) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo actualizar la tarea');
  return res.json();
}

export async function deleteCard(boardId, token, columnId, cardId) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar la tarea');
  return true;
}

export async function deleteBoard(boardId, token) {
  const res = await fetch(`${API_BASE_URL}/boards/${boardId}/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
  });
  if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar el tablero');
  return true;
}

export default {
  getBoard,
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  createCard,
  updateCard,
  deleteCard,
};

import { useCallback, useEffect, useState } from 'react';
import * as boardApi from '../utils/boardApi';

// Hook that encapsulates board data fetching and mutation helpers.
// Keeps the component lean by moving API calls and member-resolution here.
export default function useBoardData(boardId, token, user) {
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const loadBoardAndColumns = useCallback(async () => {
    if (!boardId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const [boardData, columnsData] = await Promise.all([
        boardApi.getBoard(boardId, token),
        boardApi.getColumns(boardId, token),
      ]);
      setBoard(boardData);
      const sortedCols = [...columnsData]
        .sort((a, b) => a.position - b.position)
        .map(col => ({ ...col, cards: (col.cards || []).sort((a, b) => a.position - b.position) }));
      setColumns(sortedCols);

      // load members and compute current user role
      try {
        const m = await boardApi.getMembers(boardId, token);
        setMembers(m);
        const myEmail = (typeof user !== 'undefined' && user && user.email) ? user.email : null;
        const me = myEmail ? m.find(x => x.user_email === myEmail) : null;
        setCurrentUserRole(me ? me.role : null);
      } catch (err) {
        // don't block board load if members can't be fetched
        console.warn('Could not load members to compute role', err);
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [boardId, token, user]);

  useEffect(() => {
    // initial load
    loadBoardAndColumns();
  }, [loadBoardAndColumns]);

  // Mutations: create/update/delete columns/cards and members
  const createColumn = useCallback(async (title, color) => {
    const position = columns.length;
    const res = await boardApi.createColumn(boardId, token, title, color, position);
    await loadBoardAndColumns();
    return res;
  }, [boardId, token, columns.length, loadBoardAndColumns]);

  const updateColumn = useCallback(async (columnId, payload) => {
    const res = await boardApi.updateColumn(boardId, token, columnId, payload);
    return res;
  }, [boardId, token]);

  const deleteColumn = useCallback(async (columnId) => {
    const res = await boardApi.deleteColumn(boardId, token, columnId);
    await loadBoardAndColumns();
    return res;
  }, [boardId, token, loadBoardAndColumns]);

  const createCard = useCallback(async (columnId, title, description, position) => {
    const res = await boardApi.createCard(boardId, token, columnId, title, description, position);
    return res;
  }, [boardId, token]);

  const updateCard = useCallback(async (columnId, cardId, payload) => {
    const res = await boardApi.updateCard(boardId, token, columnId, cardId, payload);
    return res;
  }, [boardId, token]);

  const deleteCard = useCallback(async (columnId, cardId) => {
    const res = await boardApi.deleteCard(boardId, token, columnId, cardId);
    return res;
  }, [boardId, token]);

  const moveCard = useCallback(async (sourceColumnId, cardId, targetColumnId, targetIndex) => {
    // Delegates to updateCard and triggers reload externally if desired.
    if (!sourceColumnId || !cardId) return;
    await updateCard(sourceColumnId, cardId, { column: targetColumnId, position: targetIndex });
    // After the move, refresh to get canonical server order
    await loadBoardAndColumns();
  }, [updateCard, loadBoardAndColumns]);

  const inviteByEmail = useCallback(async (email, role = 'viewer') => {
    const res = await boardApi.inviteByEmail(boardId, token, email, role);
    await loadBoardAndColumns();
    return res;
  }, [boardId, token, loadBoardAndColumns]);

  const updateMemberRole = useCallback(async (memberId, role) => {
    const res = await boardApi.updateMemberRole(boardId, memberId, token, role);
    await loadBoardAndColumns();
    return res;
  }, [boardId, token, loadBoardAndColumns]);

  const leaveBoard = useCallback(async () => {
    const res = await boardApi.leaveBoard(boardId, token);
    return res;
  }, [boardId, token]);

  // Normalize member image URL - tries to return ABSOLUTE URL when possible
  const normalizeMemberImage = useCallback((img) => {
    const backendBase = (import.meta?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');
    const mediaBase = backendBase + '/media/';
    const defaultMemberProfile = mediaBase + 'profilepic/default.jpg';
    if (!img) return defaultMemberProfile;
    if (typeof img !== 'string') return defaultMemberProfile;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const cleaned = img.replace(/^\/+/, '');
    if (cleaned.startsWith('media/')) return backendBase + '/' + cleaned;
    return mediaBase + cleaned;
  }, []);

  return {
    board,
    columns,
    loading,
    error,
    members,
    currentUserRole,
    loadBoardAndColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
    inviteByEmail,
    updateMemberRole,
    leaveBoard,
    normalizeMemberImage,
    setMembers,
    setCurrentUserRole,
  };
}

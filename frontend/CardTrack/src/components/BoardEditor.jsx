import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import * as boardApi from '../utils/boardApi';
import Column from './board/Column';
import ColumnHeader from './board/ColumnHeader';
import CardItem from './board/CardItem';
import TaskModal from './board/TaskModal';
import AddColumnModal from './board/AddColumnModal';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const BoardEditor = () => {
  const { boardId } = useParams();
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [editingColumnColor, setEditingColumnColor] = useState('#007ACF');

  const [draggingColumnId, setDraggingColumnId] = useState(null);

  const [draggingCard, setDraggingCard] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ columnId: '', title: '', description: '' });

  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumn, setNewColumn] = useState({ title: '', color: '#007ACF' });

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const headerRefs = useRef(new Map());
  const [maxHeaderHeight, setMaxHeaderHeight] = useState(0);

  const recalcHeaderHeights = useCallback(() => {
    if (!columns || !columns.length) {
      setMaxHeaderHeight(0);
      return;
    }
    let max = 0;
    columns.forEach((c) => {
      const el = headerRefs.current.get(c.id);
      if (el) {
        const prev = el.style.height;
        el.style.height = 'auto';
        const h = el.offsetHeight;
        el.style.height = prev;
        if (h > max) max = h;
      }
    });
    setMaxHeaderHeight(max);
  }, [columns]);

  useEffect(() => {
    recalcHeaderHeights();
  }, [columns, editingColumnId, editingColumnTitle, showTaskModal, showAddColumnModal, recalcHeaderHeights]);

  useEffect(() => {
    const onResize = () => recalcHeaderHeights();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recalcHeaderHeights]);

  const loadBoardAndColumns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [boardData, columnsData] = await Promise.all([
        boardApi.getBoard(boardId, token),
        boardApi.getColumns(boardId, token),
      ]);
      setBoard(boardData);
      const sortedCols = [...columnsData].sort((a, b) => a.position - b.position)
        .map(col => ({ ...col, cards: (col.cards || []).sort((a, b) => a.position - b.position) }));
      setColumns(sortedCols);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [boardId, token]);

  useEffect(() => {
    if (!token || !boardId) return;
    loadBoardAndColumns();
    // preload members if modal open
    if (showUsersModal) {
      (async () => {
        try {
          const m = await boardApi.getMembers(boardId, token);
          setMembers(m);
          // compute current user role using AuthContext user email when available
          const myEmail = (typeof user !== 'undefined' && user && user.email) ? user.email : null;
          const me = myEmail ? m.find(x => x.user_email === myEmail) : null;
          setCurrentUserRole(me ? me.role : null);
        } catch (e) {
          console.warn('No se pudieron cargar los miembros', e);
        }
      })();
    }
  }, [boardId, token, loadBoardAndColumns, showUsersModal, user]);

  const createColumn = async (title, color) => {
    const position = columns.length;
    await boardApi.createColumn(boardId, token, title, color, position);
    await loadBoardAndColumns();
  };

  const updateColumn = async (columnId, payload) => {
    await boardApi.updateColumn(boardId, token, columnId, payload);
  };

  const deleteColumn = async (columnId) => {
    await boardApi.deleteColumn(boardId, token, columnId);
    await loadBoardAndColumns();
  };

  const createCard = async (columnId, title, description, position) => {
    await boardApi.createCard(boardId, token, columnId, title, description, position);
  };

  const updateCard = async (columnId, cardId, payload) => {
    await boardApi.updateCard(boardId, token, columnId, cardId, payload);
  };

  const deleteCard = async (columnId, cardId) => {
    await boardApi.deleteCard(boardId, token, columnId, cardId);
  };

  const handleAddColumn = () => {
    setNewColumn({ title: '', color: '#007ACF' });
    setShowAddColumnModal(true);
  };

  const submitAddColumn = async () => {
    const title = newColumn.title.trim();
    if (!title) return;
    try {
      await createColumn(title, newColumn.color);
      setShowAddColumnModal(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const openTaskModal = () => {
    if (!columns.length) {
      alert('Primero crea una columna.');
      return;
    }
    setTaskForm({ columnId: String(columns[0].id), title: '', description: '' });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setTaskForm({ columnId: '', title: '', description: '' });
  };

  const submitTaskModal = async () => {
    const title = taskForm.title.trim();
    if (!title) return;
    const colId = Number(taskForm.columnId);
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    try {
      const position = (col.cards || []).length;
      await createCard(col.id, title, taskForm.description.trim(), position);
      closeTaskModal();
      await loadBoardAndColumns();
    } catch (e) {
      alert(e.message);
    }
  };

  const startEditColumn = (column) => {
    setEditingColumnId(column.id);
    setEditingColumnTitle(column.title);
    setEditingColumnColor(column.color || '#007ACF');
  };

  const confirmEditColumn = async (column) => {
    const title = editingColumnTitle.trim();
    if (!title) return setEditingColumnId(null);
    try {
      await updateColumn(column.id, { title, color: editingColumnColor });
      setEditingColumnId(null);
      await loadBoardAndColumns();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteColumn = async (column) => {
    if (!window.confirm(`¿Eliminar la columna "${column.title}"? Sus tareas serán movidas a la columna más cercana.`)) return;
    try {
      const sorted = [...columns].sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex(c => c.id === column.id);
      const target = sorted[idx - 1] || sorted[idx + 1];

      if (target) {
        const targetCardsCount = (target.cards || []).length;
        const moves = (column.cards || []).sort((a, b) => a.position - b.position)
          .map((card, i) => updateCard(column.id, card.id, { column: target.id, position: targetCardsCount + i }));
        await Promise.all(moves);
      }

      await deleteColumn(column.id);
    } catch (e) {
      alert(e.message);
    } finally {
      await loadBoardAndColumns();
    }
  };

  const handleEditTask = async (column, card) => {
    const newTitle = window.prompt('Nuevo nombre de la tarea:', card.title);
    if (newTitle === null) return;
    const newDescription = window.prompt('Nueva descripción (opcional):', card.description || '');
    try {
      await updateCard(column.id, card.id, { title: newTitle.trim(), description: (newDescription || '').trim() });
      await loadBoardAndColumns();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteTask = async (column, card) => {
    if (!window.confirm(`¿Eliminar la tarea "${card.title}"?`)) return;
    try {
      await deleteCard(column.id, card.id);
      const col = columns.find(c => c.id === column.id);
      if (col) {
        const remaining = (col.cards || []).filter(c => c.id !== card.id).sort((a, b) => a.position - b.position);
        await Promise.all(remaining.map((c, index) => updateCard(column.id, c.id, { position: index })));
      }
    } catch (e) {
      alert(e.message);
    } finally {
      await loadBoardAndColumns();
    }
  };

  const onColumnDragStart = (e, columnId) => {
    setDraggingColumnId(columnId);
    e.dataTransfer.setData('text/column-id', String(columnId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onColumnDragOver = (e) => {
    e.preventDefault();
  };

  const onColumnDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const sourceId = draggingColumnId || Number(e.dataTransfer.getData('text/column-id'));
    if (!sourceId || sourceId === targetColumnId) return;

    const current = [...columns];
    const fromIndex = current.findIndex(c => c.id === sourceId);
    const toIndex = current.findIndex(c => c.id === targetColumnId);
    if (fromIndex === -1 || toIndex === -1) return;

    const moved = current.splice(fromIndex, 1)[0];
    current.splice(toIndex, 0, moved);

    setColumns(current.map((c, idx) => ({ ...c, position: idx })));

    try {
      await Promise.all(current.map((c, idx) => updateColumn(c.id, { position: idx })));
    } catch (e2) {
      alert(e2.message);
    } finally {
      setDraggingColumnId(null);
      await loadBoardAndColumns();
    }
  };

  const onCardDragStart = (e, card, fromColumnId) => {
    setDraggingCard({ cardId: card.id, fromColumnId });
    e.dataTransfer.setData('application/x-card', JSON.stringify({ cardId: card.id, fromColumnId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onCardDragOverList = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onCardDropOnListEnd = async (e, targetColumn) => {
    e.preventDefault();
    const data = draggingCard || JSON.parse(e.dataTransfer.getData('application/x-card') || '{}');
    if (!data || !data.cardId) return;

    const sourceColumnId = data.fromColumnId;
    const targetColumnId = targetColumn.id;
    const targetIndex = (targetColumn.cards || []).length;

    await moveCard(sourceColumnId, data.cardId, targetColumnId, targetIndex);
  };

  const onCardDropOnItem = async (e, targetColumn, targetCard) => {
    e.preventDefault();
    const data = draggingCard || JSON.parse(e.dataTransfer.getData('application/x-card') || '{}');
    if (!data || !data.cardId) return;

    const sourceColumnId = data.fromColumnId;
    const targetColumnId = targetColumn.id;

    const targetIndex = (targetColumn.cards || []).sort((a, b) => a.position - b.position)
      .findIndex(c => c.id === targetCard.id);
    const insertIndex = Math.max(0, targetIndex);

    await moveCard(sourceColumnId, data.cardId, targetColumnId, insertIndex);
  };

  const moveCard = async (sourceColumnId, cardId, targetColumnId, targetIndex) => {
    if (!sourceColumnId || !cardId) return;

    const currentCols = [...columns].map(c => ({ ...c, cards: [...(c.cards || [])] }));
    const sourceCol = currentCols.find(c => c.id === sourceColumnId);
    const targetCol = currentCols.find(c => c.id === targetColumnId);
    if (!sourceCol || !targetCol) return;

    const card = sourceCol.cards.find(c => c.id === cardId);
    if (!card) return;

    sourceCol.cards = sourceCol.cards.filter(c => c.id !== cardId);
    targetCol.cards.splice(Math.min(targetIndex, targetCol.cards.length), 0, { ...card, column: targetColumnId });

    sourceCol.cards = sourceCol.cards.map((c, i) => ({ ...c, position: i }));
    targetCol.cards = targetCol.cards.map((c, i) => ({ ...c, position: i }));
    setColumns(currentCols);

    try {
      await updateCard(sourceColumnId, cardId, { column: targetColumnId, position: targetIndex });
      await Promise.all(sourceCol.cards.map((c, idx) => updateCard(sourceColumnId, c.id, { position: idx })));
      await Promise.all(targetCol.cards
        .filter(c => c.id !== cardId)
        .map((c, idx) => updateCard(targetColumnId, c.id, { position: idx })));
    } catch (e) {
      alert(e.message);
    } finally {
      setDraggingCard(null);
      await loadBoardAndColumns();
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('users')) {
      setShowUsersModal(true);
    }
  }, [location.search]);

  const closeUsersModal = () => {
    setShowUsersModal(false);
    navigate(location.pathname, { replace: true });
  };

  if (loading) {
    return <div className="dashboard-content-message">Cargando tablero...</div>;
  }

  if (error) {
    return <div className="dashboard-content-message error">Error: {error}</div>;
  }

  return (
    <div className="board-editor-container">
      <div className="board-editor-title">
        <h1>{board ? board.title : 'Tablero Desconocido'}</h1>
      </div>

      <div className="board-columns-container">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            headerRefs={headerRefs}
            maxHeaderHeight={maxHeaderHeight}
            editingColumnId={editingColumnId}
            editingColumnTitle={editingColumnTitle}
            editingColumnColor={editingColumnColor}
            setEditingColumnTitle={setEditingColumnTitle}
            setEditingColumnColor={setEditingColumnColor}
            confirmEditColumn={confirmEditColumn}
            startEditColumn={startEditColumn}
            setEditingColumnId={setEditingColumnId}
            onColumnDragOver={onColumnDragOver}
            onColumnDrop={onColumnDrop}
            onColumnDragStart={onColumnDragStart}
            onDeleteColumn={handleDeleteColumn}
            onCardDragOverList={onCardDragOverList}
            onCardDropOnListEnd={onCardDropOnListEnd}
            onCardDragStart={onCardDragStart}
            onCardDropOnItem={onCardDropOnItem}
            handleEditTask={handleEditTask}
            handleDeleteTask={handleDeleteTask}
          />
        ))}
      </div>

      
      <div className="board-bottom-bar" role="toolbar">
        <div className="board-bottom-bar__left">
          <button className="secondary-button" onClick={() => setShowUsersModal(true)}>Ver usuarios</button>
        </div>
        <div className="board-bottom-bar__right">
          <button className="main-button main-button--small" onClick={handleAddColumn}>+ Añadir columna</button>
          <button className="main-button main-button--small" onClick={openTaskModal}>+ Añadir tarea</button>
        </div>
      </div>

      <AddColumnModal
        visible={showAddColumnModal}
        newColumn={newColumn}
        setNewColumn={setNewColumn}
        onClose={() => setShowAddColumnModal(false)}
        onSubmit={submitAddColumn}
      />

      <TaskModal
        visible={showTaskModal}
        columns={columns}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        onSubmit={submitTaskModal}
        onClose={closeTaskModal}
      />

      {showUsersModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-title">Usuarios autorizados</div>
            <div className="main-card" style={{ padding: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <input
                  type="email"
                  placeholder="Correo a invitar"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ width: '70%', padding: 6, marginRight: 8 }}
                />
                <button
                  className="main-button main-button--small"
                  disabled={inviteLoading || !inviteEmail}
                  onClick={async () => {
                    if (!inviteEmail) return;
                    setInviteLoading(true);
                    try {
                      await boardApi.inviteByEmail(boardId, token, inviteEmail, 'viewer');
                      // reload members
                      const m = await boardApi.getMembers(boardId, token);
                      setMembers(m);
                      setInviteEmail('');
                    } catch (err) {
                      alert(err.message || 'Error al invitar');
                    } finally {
                      setInviteLoading(false);
                    }
                  }}
                >Invitar</button>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {members.map((m) => (
                  <li key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{m.user_name || m.user}</strong>
                      <div style={{ color: 'var(--color-secondary-text)', fontSize: '0.9em' }}>{m.user_email || m.user}</div>
                      <div style={{ marginTop: 6 }}>
                        <span className="column-tag">{m.role === 'owner' ? 'Propietario' : m.role === 'editor' ? 'Editor' : 'Visitante'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/**
                       * Render select only if current user can act on this member.
                       * Rules (frontend mirror of backend):
                       * - owner: can change viewer<->editor and owner (but we hide owner option UX by default)
                       * - editor: can only change viewer -> editor
                       */}
                      {currentUserRole && m.role !== 'owner' && (currentUserRole === 'owner' || (currentUserRole === 'editor' && m.role === 'viewer')) ? (
                        <select value={m.role} onChange={async (e) => {
                          const newRole = e.target.value;
                          // hide owner option in UI so frontend doesn't try to set it unless owner explicitly handles it
                          if (newRole === 'owner' && currentUserRole !== 'owner') {
                            alert('No tienes permiso para asignar owner');
                            return;
                          }
                          try {
                            await boardApi.updateMemberRole(boardId, m.id, token, newRole);
                            const updated = await boardApi.getMembers(boardId, token);
                            setMembers(updated);
                            setCurrentUserRole(updated.find(x => x.user_email === (token && token.replace('fake-token-','')))?.role || currentUserRole);
                          } catch (err) {
                            alert(err.message || 'No se pudo cambiar el rol');
                          }
                        }}>
                          <option value="viewer">Visitante</option>
                          <option value="editor">Editor</option>
                        </select>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={closeUsersModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardEditor;

import React, { useEffect, useState, useContext, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const BoardEditor = () => {
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

  const authHeaders = useMemo(
    () => ({ 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }),
    [token]
  );

  const fetchJson = useCallback(async (url) => {
    const res = await fetch(url, { headers: authHeaders });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error HTTP ${res.status}`);
    }
    return res.json();
  }, [authHeaders]);

  const loadBoardAndColumns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [boardData, columnsData] = await Promise.all([
        fetchJson(`${API_BASE_URL}/boards/${boardId}/`),
        fetchJson(`${API_BASE_URL}/boards/${boardId}/columns/`),
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
  }, [boardId, fetchJson]);

  useEffect(() => {
    if (!token || !boardId) return;
    loadBoardAndColumns();
  }, [boardId, token, loadBoardAndColumns]);

  const createColumn = async (title, color) => {
    const position = columns.length;
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title, position, color }),
    });
    if (!res.ok) throw new Error('No se pudo crear la columna');
    await loadBoardAndColumns();
  };

  const updateColumn = async (columnId, payload) => {
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo actualizar la columna');
  };

  const deleteColumn = async (columnId) => {
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar la columna');
  };

  const createCard = async (columnId, title, description, position) => {
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title, description, position }),
    });
    if (!res.ok) throw new Error('No se pudo crear la tarea');
  };

  const updateCard = async (columnId, cardId, payload) => {
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('No se pudo actualizar la tarea');
  };

  const deleteCard = async (columnId, cardId) => {
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/${cardId}/`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar la tarea');
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
          <div
            key={column.id}
            className="board-column"
            onDragOver={onColumnDragOver}
            onDrop={(e) => onColumnDrop(e, column.id)}
          >
            <div
              className="column-header"
              ref={(el) => { if (el) headerRefs.current.set(column.id, el); }}
              style={{ height: maxHeaderHeight ? `${maxHeaderHeight}px` : 'auto', backgroundColor: column.color || 'var(--color-accent-primary)' }}
              draggable
              onDragStart={(e) => onColumnDragStart(e, column.id)}
            >
                {editingColumnId === column.id ? (
                  <>
                    <input
                      className="form-input"
                      value={editingColumnTitle}
                      onChange={(e) => setEditingColumnTitle(e.target.value)}
                      placeholder="Nombre de columna"
                      style={{ marginRight: 8 }}
                    />
                    <input
                      type="color"
                      value={editingColumnColor}
                      onChange={(e) => setEditingColumnColor(e.target.value)}
                      title="Color del encabezado"
                      className="color-input"
                      style={{ width: 36, height: 36, padding: 0, marginRight: 8, cursor: 'pointer' }}
                    />
                    <div className="column-actions">
                      <button className="icon-button" title="Guardar" onClick={() => confirmEditColumn(column)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h10l4 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 4v5H9V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="icon-button" title="Cancelar" onClick={() => setEditingColumnId(null)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 title={column.title} style={{ wordBreak: 'break-word' }}>{column.title}</h3>
                    <div className="column-actions">
                      <button className="icon-button" title="Renombrar" onClick={() => startEditColumn(column)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21v-3.75l11-11L20.75 9 9.75 20H3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button className="icon-button icon-button--danger" title="Eliminar" onClick={() => handleDeleteColumn(column)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                  </>
                )}
            </div>

            <ul
              className="tasks-list"
              onDragOver={onCardDragOverList}
              onDrop={(e) => onCardDropOnListEnd(e, column)}
            >
              {(column.cards || []).map((card) => (
                <li
                  key={card.id}
                  className={`task-item`}
                  draggable
                  onDragStart={(e) => onCardDragStart(e, card, column.id)}
                  onDragOver={onCardDragOverList}
                  onDrop={(e) => onCardDropOnItem(e, column, card)}
                  title={card.description || ''}
                  onDoubleClick={(e) => {
                    const li = e.currentTarget;
                    li.classList.toggle('expanded');
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="task-title">{card.title}</div>
                    <div className="task-details">
                      <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--color-secondary-text)' }}>{card.description}</p>
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="icon-button" title="Editar" onClick={() => handleEditTask(column, card)}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21l3-1 11-11 2 2L8 22l-5 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button className="icon-button icon-button--danger" title="Eliminar" onClick={() => handleDeleteTask(column, card)}>
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
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

      {showAddColumnModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-title">Añadir columna</div>
            <div className="form-row">
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                placeholder="Ej: En progreso"
                value={newColumn.title}
                onChange={(e) => setNewColumn(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label className="form-label">Color del encabezado</label>
              <input
                type="color"
                value={newColumn.color}
                onChange={(e) => setNewColumn(prev => ({ ...prev, color: e.target.value }))}
                title="Color del encabezado"
                style={{ width: 50, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setShowAddColumnModal(false)}>Cancelar</button>
              <button className="main-button" onClick={submitAddColumn} disabled={!newColumn.title.trim()}>Crear columna</button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-title">Añadir tarea</div>
            <div className="form-row">
              <label className="form-label">Columna</label>
              <select
                className="form-input"
                value={taskForm.columnId}
                onChange={(e) => setTaskForm(prev => ({ ...prev, columnId: e.target.value }))}
              >
                {columns.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Nombre de la tarea</label>
              <input
                className="form-input"
                placeholder="Ej: Implementar API"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <label className="form-label">Descripción breve</label>
              <textarea
                className="form-input"
                placeholder="Opcional"
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button className="secondary-button" onClick={closeTaskModal}>Cancelar</button>
              <button className="main-button" onClick={submitTaskModal} disabled={!taskForm.title.trim()}>Crear tarea</button>
            </div>
          </div>
        </div>
      )}

      {showUsersModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-title">Usuarios autorizados</div>
            <div className="main-card" style={{ padding: 12 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <strong>{user?.name || user?.email || 'Usuario actual'}</strong>
                  <div style={{ color: 'var(--color-secondary-text)', fontSize: '0.9em' }}>{user?.email}</div>
                  <div style={{ marginTop: 4 }}><span className="column-tag">Propietario</span></div>
                </li>
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

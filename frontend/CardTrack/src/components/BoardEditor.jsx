import React, { useEffect, useState, useContext, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/*
  Editor de Tablero Kanban
  - Carga columnas con sus tarjetas
  - Añadir/renombrar/eliminar tareas y columnas
  - Arrastrar y soltar tareas entre columnas y reordenarlas
  - Arrastrar y reordenar columnas
  - Al eliminar una columna, sus tareas se mueven a la columna más cercana
  Cambios solicitados:
  - Quitar formularios en las columnas y el bloque lateral para añadir columna
  - Mantener botón superior "+ Añadir columna"
  - Añadir botón superior "+ Añadir tarea" que abre un formulario modal (elegir columna, nombre y descripción)
  Nota: Nombres de variables/funciones en inglés, texto visible y comentarios en español
*/

const BoardEditor = () => {
  const { boardId } = useParams();
  const { token } = useContext(AuthContext);

  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]); // cada columna incluye cards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado de edición de nombre de columna
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');

  // Estado de arrastre de columnas
  const [draggingColumnId, setDraggingColumnId] = useState(null);

  // Estado de arrastre de tareas
  const [draggingCard, setDraggingCard] = useState(null); // { cardId, fromColumnId }

  // Estado del modal para añadir tarea
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ columnId: '', title: '', description: '' });

  // Sincronizar altura de cabeceras de columnas para que todas igualen a la más alta
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
        const h = el.offsetHeight; // altura natural con padding
        el.style.height = prev;
        if (h > max) max = h;
      }
    });
    setMaxHeaderHeight(max);
  }, [columns]);

  useEffect(() => {
    recalcHeaderHeights();
  }, [columns, editingColumnId, editingColumnTitle, showTaskModal, recalcHeaderHeights]);

  useEffect(() => {
    const onResize = () => recalcHeaderHeights();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recalcHeaderHeights]);

  const authHeaders = useMemo(
    () => ({ 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }),
    [token]
  );

  // Utilidad para peticiones GET
  const fetchJson = async (url) => {
    const res = await fetch(url, { headers: authHeaders });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error HTTP ${res.status}`);
    }
    return res.json();
  };

  const loadBoardAndColumns = async () => {
    setLoading(true);
    setError(null);
    try {
      const [boardData, columnsData] = await Promise.all([
        fetchJson(`${API_BASE_URL}/boards/${boardId}/`),
        fetchJson(`${API_BASE_URL}/boards/${boardId}/columns/`),
      ]);
      setBoard(boardData);
      // Normalizar orden por position
      const sortedCols = [...columnsData].sort((a, b) => a.position - b.position)
        .map(col => ({ ...col, cards: (col.cards || []).sort((a, b) => a.position - b.position) }));
      setColumns(sortedCols);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !boardId) return;
    loadBoardAndColumns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, token]);

  // Helpers API Columns
  const createColumn = async (title) => {
    const position = columns.length; // al final
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title, position }),
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

  // Helpers API Cards
  const createCard = async (columnId, title, description, position) => {
    const res = await fetch(`${API_BASE_URL}/boards/${boardId}/columns/${columnId}/cards/`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title, description, position }),
    });
    if (!res.ok) throw new Error('No se pudo crear la tarea');
  };

  const updateCard = async (columnId, cardId, payload) => {
    // Importante: el endpoint está anidado por columna actual de la tarjeta
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

  // Acciones de UI/Negocio
  const handleAddColumn = async () => {
    const title = window.prompt('Nombre de la nueva columna:');
    if (!title) return;
    try {
      await createColumn(title.trim());
    } catch (e) {
      alert(e.message);
    } finally {
      await loadBoardAndColumns();
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
  };

  const confirmEditColumn = async (column) => {
    const title = editingColumnTitle.trim();
    if (!title) return setEditingColumnId(null);
    try {
      await updateColumn(column.id, { title });
      setEditingColumnId(null);
      await loadBoardAndColumns();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteColumn = async (column) => {
    // Al eliminar, mover sus tareas a la columna más cercana
    if (!window.confirm(`¿Eliminar la columna "${column.title}"? Sus tareas serán movidas a la columna más cercana.`)) return;
    try {
      const sorted = [...columns].sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex(c => c.id === column.id);
      const target = sorted[idx - 1] || sorted[idx + 1];

      if (target) {
        const targetCardsCount = (target.cards || []).length;
        // Mover tareas al final de la columna destino, respetando orden
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
    // Edición simple con prompt (rápido de usar)
    const newTitle = window.prompt('Nuevo nombre de la tarea:', card.title);
    if (newTitle === null) return; // cancelado
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
      // Recalcular posiciones restantes en esa columna
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

  // Drag & Drop de columnas
  const onColumnDragStart = (e, columnId) => {
    setDraggingColumnId(columnId);
    e.dataTransfer.setData('text/column-id', String(columnId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onColumnDragOver = (e) => {
    e.preventDefault(); // permitir drop
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

    // Optimismo local
    setColumns(current.map((c, idx) => ({ ...c, position: idx })));

    try {
      // Persistir nuevas posiciones
      await Promise.all(current.map((c, idx) => updateColumn(c.id, { position: idx })));
    } catch (e2) {
      alert(e2.message);
    } finally {
      setDraggingColumnId(null);
      await loadBoardAndColumns();
    }
  };

  // Drag & Drop de tareas
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
    const targetIndex = (targetColumn.cards || []).length; // al final

    await moveCard(sourceColumnId, data.cardId, targetColumnId, targetIndex);
  };

  const onCardDropOnItem = async (e, targetColumn, targetCard) => {
    e.preventDefault();
    const data = draggingCard || JSON.parse(e.dataTransfer.getData('application/x-card') || '{}');
    if (!data || !data.cardId) return;

    const sourceColumnId = data.fromColumnId;
    const targetColumnId = targetColumn.id;

    // Índice del target en su columna
    const targetIndex = (targetColumn.cards || []).sort((a, b) => a.position - b.position)
      .findIndex(c => c.id === targetCard.id);
    const insertIndex = Math.max(0, targetIndex);

    await moveCard(sourceColumnId, data.cardId, targetColumnId, insertIndex);
  };

  const moveCard = async (sourceColumnId, cardId, targetColumnId, targetIndex) => {
    if (!sourceColumnId || !cardId) return;

    // Estado actual
    const currentCols = [...columns].map(c => ({ ...c, cards: [...(c.cards || [])] }));
    const sourceCol = currentCols.find(c => c.id === sourceColumnId);
    const targetCol = currentCols.find(c => c.id === targetColumnId);
    if (!sourceCol || !targetCol) return;

    const card = sourceCol.cards.find(c => c.id === cardId);
    if (!card) return;

    // Quitar de origen
    sourceCol.cards = sourceCol.cards.filter(c => c.id !== cardId);
    // Insertar en destino
    targetCol.cards.splice(Math.min(targetIndex, targetCol.cards.length), 0, { ...card, column: targetColumnId });

    // Optimismo local: recalcular posiciones
    sourceCol.cards = sourceCol.cards.map((c, i) => ({ ...c, position: i }));
    targetCol.cards = targetCol.cards.map((c, i) => ({ ...c, position: i }));
    setColumns(currentCols);

    try {
      // 1) Actualizar la tarjeta movida (en su endpoint de columna de origen)
      await updateCard(sourceColumnId, cardId, { column: targetColumnId, position: targetIndex });

      // 2) Re-posicionar tarjetas restantes en origen
      await Promise.all(sourceCol.cards.map((c, idx) => updateCard(sourceColumnId, c.id, { position: idx })));

      // 3) Re-posicionar tarjetas en destino (incluida la movida ya está OK por 1),
      // pero para las otras tarjetas del destino usar su columna actual (targetColumnId)
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
        <div className="board-editor-actions">
          <button className="secondary-button" onClick={handleAddColumn}>+ Añadir columna</button>
          <button className="secondary-button" onClick={openTaskModal}>+ Añadir tarea</button>
        </div>
      </div>

      <div className="board-columns-container">
        {columns.map((column) => (
          <div
            key={column.id}
            className="board-column"
            draggable
            onDragStart={(e) => onColumnDragStart(e, column.id)}
            onDragOver={onColumnDragOver}
            onDrop={(e) => onColumnDrop(e, column.id)}
          >
            <div
              className="column-header"
              ref={(el) => { if (el) headerRefs.current.set(column.id, el); }}
              style={{ height: maxHeaderHeight ? `${maxHeaderHeight}px` : 'auto' }}
            >
              {editingColumnId === column.id ? (
                <>
                  <input
                    className="form-input"
                    value={editingColumnTitle}
                    onChange={(e) => setEditingColumnTitle(e.target.value)}
                    placeholder="Nombre de columna"
                  />
                  <div className="column-actions">
                    <button className="secondary-button" onClick={() => confirmEditColumn(column)}>Guardar</button>
                    <button className="secondary-button" onClick={() => setEditingColumnId(null)}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 title={column.title}>{column.title}</h3>
                  <div className="column-actions">
                    <button className="secondary-button" onClick={() => startEditColumn(column)}>Renombrar</button>
                    <button className="danger-button" onClick={() => handleDeleteColumn(column)}>Eliminar</button>
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
                  className="task-item"
                  draggable
                  onDragStart={(e) => onCardDragStart(e, card, column.id)}
                  onDragOver={onCardDragOverList}
                  onDrop={(e) => onCardDropOnItem(e, column, card)}
                  title={card.description || ''}
                >
                  <span>{card.title}</span>
                  <div className="task-actions">
                    <button className="secondary-button" onClick={() => handleEditTask(column, card)}>Editar</button>
                    <button className="danger-button" onClick={() => handleDeleteTask(column, card)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Modal para añadir tarea */}
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
    </div>
  );
};

export default BoardEditor;

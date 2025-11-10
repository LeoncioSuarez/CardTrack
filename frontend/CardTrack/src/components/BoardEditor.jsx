import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import useBoardSocket from '../hooks/useBoardSocket';
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
  const [taskForm, setTaskForm] = useState({ columnId: '', title: '', description: '', type: 'description', checklist: [] });

  // Remote changes counter (non-intrusive): if >0 show small badge allowing user to apply changes
  const [remoteChanges, setRemoteChanges] = useState(0);

  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumn, setNewColumn] = useState({ title: '', color: '#007ACF' });

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [editingRoleMemberId, setEditingRoleMemberId] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState(null);
  const [viewerNoticeVisible, setViewerNoticeVisible] = useState(false);
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
      const sortedCols = [...columnsData]
        .sort((a, b) => a.position - b.position)
        .map(col => ({ ...col, cards: (col.cards || []).sort((a, b) => a.position - b.position) }));
      setColumns(sortedCols);
      // load members to determine current user role (so UI can be read-only for viewers)
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [boardId, token, user]);

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

  // Subscribe to board websocket events and react non-intrusively
  useBoardSocket(boardId, {
    token,
    onMessage: (payload) => {
      try {
        const ev = payload && payload.event;
        const data = payload && payload.data;
        if (!ev) return;
        // If user is editing the same card, don't overwrite - show badge
        const editingCardId = taskForm && taskForm.editingCardId;
        if (showTaskModal && editingCardId && data && Number(editingCardId) === Number(data.id)) {
          setRemoteChanges((c) => c + 1);
          return;
        }
        // otherwise reload board data (granular update could be implemented later)
        loadBoardAndColumns();
      } catch (e) {
        console.warn('WS handler error', e);
      }
    }
  });

  // helper to normalize member image paths
  const backendBase = API_BASE_URL.replace(/\/api\/?$/, '');
  const mediaBase = backendBase + '/media/';
  const defaultMemberProfile = mediaBase + 'profilepic/default.jpg';
  const normalizeMemberImage = (img) => {
    if (!img) return defaultMemberProfile;
    if (typeof img !== 'string') return defaultMemberProfile;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const cleaned = img.replace(/^\/+/, '');
    if (cleaned.startsWith('media/')) return backendBase + '/' + cleaned;
    return mediaBase + cleaned;
  };

    // Show viewer notice when we know the user's role is 'viewer' and it hasn't been dismissed in this session
    useEffect(() => {
      if (currentUserRole === 'viewer') {
        try {
          const dismissed = sessionStorage.getItem(`viewer_notice_dismissed_board_${boardId}`);
          if (!dismissed) setViewerNoticeVisible(true);
        } catch (err) {
          void err;
        }
      } else {
        setViewerNoticeVisible(false);
      }
    }, [currentUserRole, boardId]);

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
    setTaskForm({ columnId: String(columns[0].id), title: '', description: '', type: 'description', checklist: [] });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setTaskForm({ columnId: '', title: '', description: '', type: 'description', checklist: [] });
  };

  const submitTaskModal = async () => {
    const title = taskForm.title.trim();
    if (!title) return;
    const colId = Number(taskForm.columnId);
    const col = columns.find(c => c.id === colId);
    if (!col) return;
    try {
      const position = (col.cards || []).length;
      // If checklist mode, serialize checklist into description as a simple markdown-like list
      let payloadDescription = '';
      if (taskForm.type === 'checklist' && Array.isArray(taskForm.checklist) && taskForm.checklist.length) {
        payloadDescription = (taskForm.checklist || []).map(i => `- [ ] ${i}`).join('\n');
      } else {
        payloadDescription = (taskForm.description || '').trim();
      }
      if (taskForm.editingCardId) {
        // editing existing card
        const cardId = taskForm.editingCardId;
        const origColumnId = taskForm.originalColumnId ? Number(taskForm.originalColumnId) : Number(colId);
        const payload = { title, description: payloadDescription };
        const newColumnId = Number(taskForm.columnId);
        if (newColumnId !== origColumnId) {
          // request backend to move column
          payload.column = newColumnId;
          const target = columns.find(c => c.id === newColumnId);
          payload.position = target ? (target.cards || []).length : 0;
        }
        await updateCard(origColumnId, cardId, payload);
      } else {
        await createCard(col.id, title, payloadDescription, position);
      }
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
    // Open edit modal instead of prompt. Populate form with card data.
    try {
      const desc = card.description || '';
      const lines = desc.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const items = lines.map((l) => {
        const m = l.match(/^[-*]\s*\[(x|X| |)\]\s*(.*)$/);
        if (m) return { isChecklist: true, checked: !!m[1] && m[1].toLowerCase() === 'x', text: m[2] };
        return { isChecklist: false, text: l };
      });
      const allChecklist = items.length > 0 && items.every(i => i.isChecklist);
      const checklist = allChecklist ? items.map(i => i.text) : [];
      setTaskForm({
        columnId: String(column.id),
        title: card.title || '',
        description: allChecklist ? '' : (card.description || ''),
        type: allChecklist ? 'checklist' : 'description',
        checklist,
        editingCardId: card.id,
        originalColumnId: column.id,
      });
      setShowTaskModal(true);
    } catch (e) {
      alert(e.message || 'No se pudo abrir el editor de la tarea');
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
    // prevent column dragging for viewers
    if (currentUserRole === 'viewer') return;
    setDraggingColumnId(columnId);
    e.dataTransfer.setData('text/column-id', String(columnId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onColumnDragOver = (e) => {
    e.preventDefault();
  };

  const onColumnDrop = async (e, targetColumnId) => {
    e.preventDefault();
    if (currentUserRole === 'viewer') return;
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
    // prevent card dragging for viewers
    if (currentUserRole === 'viewer') return;
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
    if (currentUserRole === 'viewer') return;
    const data = draggingCard || JSON.parse(e.dataTransfer.getData('application/x-card') || '{}');
    if (!data || !data.cardId) return;

    const sourceColumnId = data.fromColumnId;
    const targetColumnId = targetColumn.id;
    const targetIndex = (targetColumn.cards || []).length;

    await moveCard(sourceColumnId, data.cardId, targetColumnId, targetIndex);
  };

  const onCardDropOnItem = async (e, targetColumn, targetCard) => {
    e.preventDefault();
    if (currentUserRole === 'viewer') return;
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
    if (currentUserRole === 'viewer') return;
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

  // Instead of returning a full-page loading placeholder which breaks immersion,
  // render the board shell and show lightweight inline loaders/skeletons.
  const isLoading = loading;

  if (error) {
    return <div className="dashboard-content-message error">Error: {error}</div>;
  }

  return (
    <div className="board-editor-container">
      <div className={"board-editor-title" + (currentUserRole === 'viewer' ? ' board-editor-title--viewer' : '')}>
  <h1>{board ? board.title : 'Tablero Desconocido'}</h1>
      </div>

        {remoteChanges > 0 && (
        <div style={{ padding: 8, margin: '0 0 8px 0', background: 'rgba(255,245,200,0.9)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 6 }}>
          <span style={{ marginRight: 12 }}>Hay {remoteChanges} cambio(s) remotos. </span>
          <button className="main-button main-button--small" onClick={async () => { await loadBoardAndColumns(); setRemoteChanges(0); }}>Aplicar cambios</button>
        </div>
      )}

      {/* Loading UI removed: we render the board shell immediately to avoid visual flashes. */}

  <div className={"board-columns-container " + (columns && columns.length > 4 ? 'columns-scroll' : 'columns-fit')}>
        {currentUserRole === 'viewer' && viewerNoticeVisible && (
          <div className="viewer-notice" role="status" aria-live="polite">
            <div className="viewer-notice__text">Actualmente te encuentras con el rango de visitante, por lo que no puedes realizar ningún tipo de cambio en la tabla.</div>
            <button className="viewer-notice__close" aria-label="Cerrar" onClick={() => {
              try { sessionStorage.setItem(`viewer_notice_dismissed_board_${boardId}`, '1'); } catch(err) { void err; }
              setViewerNoticeVisible(false);
            }}>×</button>
          </div>
        )}
        {(() => {
          const totalCards = (columns || []).reduce((s, c) => s + ((c.cards && c.cards.length) || 0), 0);
          return columns.map((column) => (
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
            currentUserRole={currentUserRole}
            totalCards={totalCards}
          />
        ))
        })()}
      </div>

      
      <div className="board-bottom-bar" role="toolbar">
        <div className="board-bottom-bar__left">
          <button className="secondary-button" onClick={() => setShowUsersModal(true)}>Ver usuarios</button>
        </div>
        <div className="board-bottom-bar__right">
          {currentUserRole !== 'viewer' && (
            <>
              <button className="main-button main-button--small" onClick={handleAddColumn}>+ Añadir columna</button>
              <button className="main-button main-button--small" onClick={openTaskModal}>+ Añadir tarea</button>
            </>
          )}
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
            <div className="main-card modal-main-card">
              <div className="mb-8">
                <input
                  type="email"
                  placeholder="Correo a invitar"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="invite-input"
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

              <ul className="members-list">
                {members.map((m) => (
                  <li key={m.id}>
                    <div className="member-row">
                      <div className="member-avatar-box">
                        <img src={normalizeMemberImage(m.user_profilepicture || m.profilepicture || m.avatar || '')} alt="avatar" onError={(e) => { e.currentTarget.src = defaultMemberProfile; }} />
                      </div>
                      <div className="member-info">
                        <div className="member-name">{m.user_name || m.user}</div>
                        <div className="member-email">{m.user_email || m.user}</div>
                      </div>
                      <div className="member-role-wrapper">
                        {editingRoleMemberId === m.id ? (
                          <select value={editingRoleValue} onChange={async (e) => {
                            const newRole = e.target.value;
                            if (newRole === 'owner' && currentUserRole !== 'owner') {
                              alert('No tienes permiso para asignar owner');
                              return;
                            }
                            try {
                              await boardApi.updateMemberRole(boardId, m.id, token, newRole);
                              const updated = await boardApi.getMembers(boardId, token);
                              setMembers(updated);
                              setEditingRoleMemberId(null);
                              setEditingRoleValue(null);
                            } catch (err) {
                              alert(err.message || 'No se pudo cambiar el rol');
                            }
                          }} onBlur={() => { setEditingRoleMemberId(null); setEditingRoleValue(null); }}>
                            <option value="viewer">Visitante</option>
                            <option value="editor">Editor</option>
                            {currentUserRole === 'owner' ? <option value="owner">Propietario</option> : null}
                          </select>
                          ) : (
                          <div className={`member-role-tag ${(currentUserRole === 'owner' || (currentUserRole === 'editor' && m.role === 'viewer')) ? 'member-role-clickable' : ''}`} onDoubleClick={() => {
                            if (currentUserRole === 'owner' || (currentUserRole === 'editor' && m.role === 'viewer')) {
                              setEditingRoleMemberId(m.id);
                              setEditingRoleValue(m.role);
                            }
                          }}>{m.role === 'owner' ? 'Propietario' : m.role === 'editor' ? 'Editor' : 'Visitante'}</div>
                        )}

                        <div className="members-actions">
                          {!((m.role === 'owner')) && currentUserRole && (currentUserRole === 'owner' || (currentUserRole === 'editor' && m.role === 'viewer')) ? (
                            <button className="icon-button" title="Cambiar rol" onClick={() => { setEditingRoleMemberId(m.id); setEditingRoleValue(m.role); }}>
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21l3-1 11-11 2 2L8 22l-5 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          ) : null}
                          {currentUserRole === 'owner' && m.role !== 'owner' ? (
                            <button className="icon-button icon-button--danger" title="Eliminar" onClick={async () => {
                              if (!window.confirm(`¿Eliminar el acceso de ${m.user_name || m.user}?`)) return;
                              try {
                                await boardApi.updateMemberRole(boardId, m.id, token, 'viewer');
                                // or call a delete member endpoint if exists
                                const updated = await boardApi.getMembers(boardId, token);
                                setMembers(updated);
                              } catch (err) { alert(err.message || 'Error'); }
                            }}>
                              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          ) : null}
                        </div>
                      </div>
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

import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import useBoardSocket from '../hooks/useBoardSocket';
import useBoardData from '../hooks/useBoardData';
import useBoardEditorDrag from '../hooks/useBoardEditorDrag';
import { useFlash } from '../context/useFlash.js';
import Column from './board/Column';
import ColumnHeader from './board/ColumnHeader';
import CardItem from './board/CardItem';
import TaskModal from './board/TaskModal';
import AddColumnModal from './board/AddColumnModal';
import BoardUsersModal from './BoardUsersModal';
import BoardBottomBar from './BoardBottomBar';
import BoardHeader from './BoardHeader';
import useHeaderSizing from '../hooks/useHeaderSizing';
import useTaskForm from '../hooks/useTaskForm';

export const BoardEditor = () => {
  const { boardId } = useParams();
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { show } = useFlash();
  // centralize board data & mutations in hook
  const {
  board,
  columns,
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
  normalizeMemberImage,
  } = useBoardData(boardId, token, user);

  // default profile path (computed from hook helper)
  const defaultMemberProfile = normalizeMemberImage(null);

  const [editingColumnId, setEditingColumnId] = useState(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [editingColumnColor, setEditingColumnColor] = useState('#007ACF');

  // Estado y handlers de arrastre (drag & drop)
  // Extraídos a `useBoardEditorDrag` para que `BoardEditor` sea más legible.
  // Nota: no desestructuramos setters que no usamos para evitar warnings de ESLint.
  const {
    onColumnDragStart,
    onColumnDragOver,
    onColumnDrop,
    onCardDragStart,
    onCardDragOverList,
    onCardDropOnListEnd,
    onCardDropOnItem,
  } = useBoardEditorDrag({
    columns,
    currentUserRole,
    updateColumn,
    moveCard,
    loadBoardAndColumns,
  });
  // Task form state & handlers extraídos a `useTaskForm`
  const {
    taskForm,
    setTaskForm,
    showTaskModal,
    openTaskModal,
    closeTaskModal,
    submitTaskModal,
    startEditTask,
  } = useTaskForm({ columns, createCard, updateCard, loadBoardAndColumns });
  const [remoteChanges, setRemoteChanges] = useState(0);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumn, setNewColumn] = useState({ title: '', color: '#007ACF' });
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [editingRoleMemberId, setEditingRoleMemberId] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState(null);
  const [viewerNoticeVisible, setViewerNoticeVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // header sizing hook: mantiene `headerRefs` y `maxHeaderHeight`
  const { headerRefs, maxHeaderHeight } = useHeaderSizing({
    columns,
    editingColumnId,
    editingColumnTitle,
    showTaskModal,
    showAddColumnModal,
  });


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

  // normalizeMemberImage and defaultMemberProfile are provided by useBoardData hook

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

  // create/update/delete/move functions are provided by useBoardData hook

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
      show(e.message || 'Error al crear columna', 'error');
    }
  };

  // openTaskModal/closeTaskModal/submitTaskModal ahora vienen del hook useTaskForm

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
      show(e.message || 'Error al actualizar columna', 'error');
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
      show(e.message || 'Error al eliminar columna', 'error');
    } finally {
      await loadBoardAndColumns();
    }
  };

  const handleEditTask = (column, card) => {
    // delegamos la preparación del formulario al hook
    try {
      startEditTask(column, card);
    } catch (e) {
      show(e.message || 'No se pudo abrir el editor de la tarea', 'error');
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
      show(e.message || 'Error al eliminar tarea', 'error');
    } finally {
      await loadBoardAndColumns();
    }
  };

  // drag handlers moved to hook above

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

  if (error) {
    return <div className="dashboard-content-message error">Error: {error}</div>;
  }

  return (
    <div className="board-editor-container">
          <BoardHeader
            board={board}
            currentUserRole={currentUserRole}
            viewerNoticeVisible={viewerNoticeVisible}
            setViewerNoticeVisible={setViewerNoticeVisible}
            boardId={boardId}
            remoteChanges={remoteChanges}
            onApplyRemoteChanges={async () => { await loadBoardAndColumns(); setRemoteChanges(0); }}
          />

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

      
      <BoardBottomBar
        currentUserRole={currentUserRole}
        onShowUsers={() => setShowUsersModal(true)}
        onAddColumn={handleAddColumn}
        onAddTask={openTaskModal}
      />

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

      <BoardUsersModal
        visible={showUsersModal}
        members={members}
        normalizeMemberImage={normalizeMemberImage}
        defaultMemberProfile={defaultMemberProfile}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteLoading={inviteLoading}
        onInvite={async () => {
          if (!inviteEmail) return;
          setInviteLoading(true);
          try {
            await inviteByEmail(inviteEmail, 'viewer');
            await loadBoardAndColumns();
            setInviteEmail('');
          } catch (err) {
            show(err.message || 'Error al invitar', 'error');
          } finally {
            setInviteLoading(false);
          }
        }}
        editingRoleMemberId={editingRoleMemberId}
        editingRoleValue={editingRoleValue}
        setEditingRoleMemberId={setEditingRoleMemberId}
        setEditingRoleValue={setEditingRoleValue}
        updateMemberRole={updateMemberRole}
        currentUserRole={currentUserRole}
        close={closeUsersModal}
      />
    </div>
  );
};

export default BoardEditor;

import React from 'react';

// Componente que muestra el título del tablero, aviso de viewer y notificación de cambios remotos.
const BoardHeader = ({ board, currentUserRole, viewerNoticeVisible, setViewerNoticeVisible, boardId, remoteChanges, onApplyRemoteChanges }) => {
  return (
    <>
      <div className={"board-editor-title" + (currentUserRole === 'viewer' ? ' board-editor-title--viewer' : '')}>
        <h1>{board ? board.title : 'Tablero Desconocido'}</h1>
      </div>

      {currentUserRole === 'viewer' && viewerNoticeVisible && (
        <div className="viewer-notice" role="status" aria-live="polite">
          <div className="viewer-notice__text">Actualmente te encuentras con el rango de visitante, por lo que no puedes realizar ningún tipo de cambio en la tabla.</div>
          <button className="viewer-notice__close" aria-label="Cerrar" onClick={() => {
            try { sessionStorage.setItem(`viewer_notice_dismissed_board_${boardId}`, '1'); } catch(err) { void err; }
            setViewerNoticeVisible(false);
          }}>×</button>
        </div>
      )}

      {remoteChanges > 0 && (
        <div style={{ padding: 8, margin: '0 0 8px 0', background: 'rgba(255,245,200,0.9)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 6 }}>
          <span style={{ marginRight: 12 }}>Hay {remoteChanges} cambio(s) remotos. </span>
          <button className="main-button main-button--small" onClick={onApplyRemoteChanges}>Aplicar cambios</button>
        </div>
      )}
    </>
  );
};

export default BoardHeader;

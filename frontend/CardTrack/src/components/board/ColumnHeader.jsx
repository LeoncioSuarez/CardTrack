import React from 'react';

export const ColumnHeader = ({
  column,
  editingColumnId,
  editingColumnTitle,
  editingColumnColor,
  setEditingColumnTitle,
  setEditingColumnColor,
  confirmEditColumn,
  startEditColumn,
  setEditingColumnId,
  headerRef,
  maxHeaderHeight,
  onDragStart,
  onDeleteColumn,
  currentUserRole,
  
}) => {
  const isEditing = editingColumnId === column.id;

  return (
    <div
      className="column-header"
      ref={headerRef}
      // set CSS variables so styling resides in index.css; values can be dynamic
      style={{
        '--column-height': maxHeaderHeight ? `${maxHeaderHeight}px` : 'auto',
        '--column-bg': column.color || 'var(--color-accent-primary)'
      }}
      draggable={currentUserRole !== 'viewer'}
      onDragStart={(e) => (currentUserRole !== 'viewer' && onDragStart) ? onDragStart(e, column.id) : undefined}
    >
      {/* column header controls (counter moved to task cards) */}
      {isEditing ? (
        <>
          <input
            className="form-input mr-8"
            value={editingColumnTitle}
            onChange={(e) => setEditingColumnTitle(e.target.value)}
            placeholder="Nombre de columna"
          />
          <input
            type="color"
            value={editingColumnColor}
            onChange={(e) => setEditingColumnColor(e.target.value)}
            title="Color del encabezado"
            className="color-input color-input--large mr-8"
          />
          <div className="column-actions">
            {currentUserRole !== 'viewer' && (
              <>
            <button className="icon-button" title="Guardar" onClick={() => confirmEditColumn(column)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h10l4 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 4v5H9V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="icon-button" title="Cancelar" onClick={() => setEditingColumnId(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <h3 title={column.title} className="col-title">{column.title}</h3>
            <div className="column-actions">
            {currentUserRole !== 'viewer' && (
              <>
            <button className="icon-button" title="Renombrar" onClick={() => startEditColumn(column)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21v-3.75l11-11L20.75 9 9.75 20H3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="icon-button icon-button--danger" title="Eliminar" onClick={() => onDeleteColumn && onDeleteColumn(column)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ColumnHeader;

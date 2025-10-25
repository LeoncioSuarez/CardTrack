import React from 'react';

export const CardItem = ({ card, column, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDoubleClick, currentUserRole }) => {
  const isViewer = currentUserRole === 'viewer';
  return (
    <li
      key={card.id}
      className={`task-item`}
      draggable={!isViewer}
      onDragStart={(e) => !isViewer && onDragStart && onDragStart(e, card, column.id)}
      onDragOver={isViewer ? undefined : onDragOver}
      onDrop={(e) => !isViewer && onDrop && onDrop(e, column, card)}
      title={card.description || ''}
      onDoubleClick={onDoubleClick}
    >
      <div style={{ flex: 1 }}>
        <div className="task-title">{card.title}</div>
        <div className="task-details">
          <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--color-secondary-text)' }}>{card.description}</p>
        </div>
      </div>
      <div className="task-actions">
        {!isViewer && (
          <button className="icon-button" title="Editar" onClick={() => onEdit(column, card)}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21l3-1 11-11 2 2L8 22l-5 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
        {!isViewer && (
          <button className="icon-button icon-button--danger" title="Eliminar" onClick={() => onDelete(column, card)}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>
    </li>
  );
};

export default CardItem;

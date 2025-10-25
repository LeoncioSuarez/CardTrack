import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useParams } from 'react-router-dom';
import * as boardApi from '../../utils/boardApi';

export const CardItem = ({ card, column, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDoubleClick, currentUserRole }) => {
  const isViewer = currentUserRole === 'viewer';
  const { token } = useContext(AuthContext);
  const { boardId } = useParams();

  // Detect checklist in description (lines starting with '- [ ]' or '- [x]')
  const parseChecklist = (desc) => {
    if (!desc) return null;
    const lines = desc.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items = lines.map((l) => {
      const m = l.match(/^[-*]\s*\[(x|X| |)\]\s*(.*)$/);
      if (m) {
        return { isChecklist: true, checked: !!m[1] && m[1].toLowerCase() === 'x', text: m[2] };
      }
      return { isChecklist: false, text: l };
    });
    const allChecklist = items.length > 0 && items.every(i => i.isChecklist);
    return allChecklist ? items.map(i => ({ text: i.text, checked: i.checked })) : null;
  };

  const [localChecklist, setLocalChecklist] = useState(() => parseChecklist(card.description));

  useEffect(() => {
    setLocalChecklist(parseChecklist(card.description));
  }, [card.description]);

  const toggleItem = async (index) => {
    if (!token || !boardId) return;
    const prev = localChecklist || [];
    const next = prev.map((it, i) => i === index ? { ...it, checked: !it.checked } : it);
    // optimistic update
    setLocalChecklist(next);
    // build description lines
    const desc = next.map(it => `- [${it.checked ? 'x' : ' '}] ${it.text}`).join('\n');
    try {
      await boardApi.updateCard(boardId, token, column.id, card.id, { description: desc });
    } catch (e) {
      // revert on error
      setLocalChecklist(prev);
      alert(e.message || 'No se pudo actualizar la checklist');
    }
  };

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
          {localChecklist ? (
            <ul className="card-checklist" style={{ marginTop: 8, marginBottom: 8 }}>
              {localChecklist.map((it, idx) => (
                <li key={idx} className="card-checklist-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={!!it.checked} onChange={() => toggleItem(idx)} disabled={isViewer} />
                  <span style={{ color: 'var(--color-secondary-text)' }}>{it.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ marginTop: 8, marginBottom: 8, color: 'var(--color-secondary-text)' }}>{card.description}</p>
          )}
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

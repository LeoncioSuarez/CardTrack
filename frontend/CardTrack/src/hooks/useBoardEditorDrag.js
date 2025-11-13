import { useState } from 'react';
import { useFlash } from '../context/useFlash.js';

// Hook para manejar el arrastre (drag & drop) en el editor de tableros.
// Este hook centraliza el estado y los handlers para columnas y tarjetas.
// Lo exponemos como funciones que el componente principal puede pasar a los
// subcomponentes (Column, CardItem) sin importar la implementación.
export default function useBoardEditorDrag({ columns, currentUserRole, updateColumn, moveCard, loadBoardAndColumns }) {
  const { show } = useFlash();
  // Si se desea exponer el estado interno para UI adicionales, podemos
  // mantener estos estados. Actualmente el editor solo necesita los handlers.
  const [draggingColumnId, setDraggingColumnId] = useState(null);
  const [draggingCard, setDraggingCard] = useState(null);

  // Inicia el drag de una columna
  const onColumnDragStart = (e, columnId) => {
    if (currentUserRole === 'viewer') return;
    setDraggingColumnId(columnId);
    e.dataTransfer.setData('text/column-id', String(columnId));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Permitir drop sobre columnas
  const onColumnDragOver = (e) => {
    e.preventDefault();
  };

  // Drop de columna: calculamos la nueva posición y pedimos al backend que la aplique
  const onColumnDrop = async (e, targetColumnId) => {
    e.preventDefault();
    if (currentUserRole === 'viewer') return;
    const sourceId = draggingColumnId || Number(e.dataTransfer.getData('text/column-id'));
    if (!sourceId || sourceId === targetColumnId) return;

    const current = [...(columns || [])];
    const fromIndex = current.findIndex(c => c.id === sourceId);
    const toIndex = current.findIndex(c => c.id === targetColumnId);
    if (fromIndex === -1 || toIndex === -1) return;

    const moved = current.splice(fromIndex, 1)[0];
    current.splice(toIndex, 0, moved);

    try {
      // Enviamos posiciones al servidor; el servidor emitirá el orden canonical
      await Promise.all(current.map((c, idx) => updateColumn(c.id, { position: idx })));
    } catch (e2) {
      show(e2.message || 'Error al reordenar columnas', 'error');
    } finally {
      setDraggingColumnId(null);
      await loadBoardAndColumns();
    }
  };

  // Comienza el drag de una tarjeta
  const onCardDragStart = (e, card, fromColumnId) => {
    if (currentUserRole === 'viewer') return;
    setDraggingCard({ cardId: card.id, fromColumnId });
    e.dataTransfer.setData('application/x-card', JSON.stringify({ cardId: card.id, fromColumnId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Permitir drop sobre listas de tarjetas
  const onCardDragOverList = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Drop al final de la lista (append)
  const onCardDropOnListEnd = async (e, targetColumn) => {
    e.preventDefault();
    if (currentUserRole === 'viewer') return;
    const data = draggingCard || JSON.parse(e.dataTransfer.getData('application/x-card') || '{}');
    if (!data || !data.cardId) return;

    const sourceColumnId = data.fromColumnId;
    const targetColumnId = targetColumn.id;
    const targetIndex = (targetColumn.cards || []).length;
    try {
      await moveCard(sourceColumnId, data.cardId, targetColumnId, targetIndex);
    } finally {
      setDraggingCard(null);
    }
  };

  // Drop sobre un item concreto: insertar antes/after
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
    try {
      await moveCard(sourceColumnId, data.cardId, targetColumnId, insertIndex);
    } finally {
      setDraggingCard(null);
    }
  };

  // Devolvemos únicamente los handlers que el editor necesita. Si en el futuro
  // necesitamos exponer más estado, lo añadimos aquí.
  return {
    onColumnDragStart,
    onColumnDragOver,
    onColumnDrop,
    onCardDragStart,
    onCardDragOverList,
    onCardDropOnListEnd,
    onCardDropOnItem,
  };
}

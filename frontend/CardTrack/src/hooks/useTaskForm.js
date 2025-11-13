import { useState } from 'react';

// Hook para manejar el formulario/modal de tareas (crear/editar/mover).
// Este hook encapsula el estado `taskForm`, muestra/oculta el modal y realiza
// las llamadas a `createCard` / `updateCard` / `loadBoardAndColumns`.
export default function useTaskForm({ columns = [], createCard, updateCard, loadBoardAndColumns }) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ columnId: '', title: '', description: '', type: 'description', checklist: [] });

  // Abrir modal para crear nueva tarea: preseleccionamos la primera columna
  const openTaskModal = () => {
    if (!columns || !columns.length) {
      // El componente que llama se encargará de avisar si no hay columnas
      return;
    }
    setTaskForm({ columnId: String(columns[0].id), title: '', description: '', type: 'description', checklist: [] });
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setTaskForm({ columnId: '', title: '', description: '', type: 'description', checklist: [] });
  };

  // Start editing existing card: parse description to checklist if corresponde
  const startEditTask = (column, card) => {
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
  };

  // Submit: crear o editar tarjeta. Si se mueve entre columnas, incluye position.
  const submitTaskModal = async () => {
    const title = (taskForm.title || '').trim();
    if (!title) return;
    const colId = Number(taskForm.columnId);
    const col = (columns || []).find(c => c.id === colId);
    if (!col) return;

    const position = (col.cards || []).length;
    let payloadDescription = '';
    if (taskForm.type === 'checklist' && Array.isArray(taskForm.checklist) && taskForm.checklist.length) {
      payloadDescription = (taskForm.checklist || []).map(i => `- [ ] ${i}`).join('\n');
    } else {
      payloadDescription = (taskForm.description || '').trim();
    }

    if (taskForm.editingCardId) {
      const cardId = taskForm.editingCardId;
      const origColumnId = taskForm.originalColumnId ? Number(taskForm.originalColumnId) : Number(colId);
      const payload = { title, description: payloadDescription };
      const newColumnId = Number(taskForm.columnId);
      if (newColumnId !== origColumnId) {
        payload.column = newColumnId;
        const target = (columns || []).find(c => c.id === newColumnId);
        payload.position = target ? (target.cards || []).length : 0;
      }
      await updateCard(origColumnId, cardId, payload);
    } else {
      await createCard(col.id, title, payloadDescription, position);
    }
    closeTaskModal();
    await loadBoardAndColumns();
  };

  return {
    taskForm,
    setTaskForm,
    showTaskModal,
    openTaskModal,
    closeTaskModal,
    submitTaskModal,
    startEditTask,
  };
}

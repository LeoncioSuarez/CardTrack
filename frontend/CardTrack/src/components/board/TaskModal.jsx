import React, { useState } from 'react';

export const TaskModal = ({ visible, columns, taskForm, setTaskForm, onSubmit, onClose }) => {
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [modalAlert, setModalAlert] = useState('');
  const clearAlert = (ms = 4200) => {
    setTimeout(() => setModalAlert(''), ms);
  };
  if (!visible) return null;

  const addChecklistItem = () => {
    const v = (newChecklistItem || '').trim();
    if (!v) return;
    if ((taskForm.checklist || []).length >= 6) {
      setModalAlert('La checklist solo puede tener un máximo de 6 elementos.');
      clearAlert();
      return;
    }
    if (v.length > 50) {
      setModalAlert('Cada elemento de la checklist puede tener como máximo 50 caracteres.');
      clearAlert();
      return;
    }
    // avoid duplicates
    const exists = (taskForm.checklist || []).some(x => x === v);
    if (exists) {
      setNewChecklistItem('');
      return;
    }
    setTaskForm(prev => ({ ...prev, checklist: [...(prev.checklist || []), v] }));
    setNewChecklistItem('');
  };

  const removeChecklistItem = (idx) => {
    setTaskForm(prev => ({ ...prev, checklist: (prev.checklist || []).filter((_, i) => i !== idx) }));
  };

  const onKeyDownChecklist = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChecklistItem();
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-title">Añadir tarea</div>
        {modalAlert && (
          <div className="modal-alert modal-alert--spaced" role="alert">{modalAlert}</div>
        )}
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
          <label className="form-label">Tipo de tarea</label>
          <select
            className="form-input"
            value={taskForm.type || 'description'}
            onChange={(e) => setTaskForm(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="description">Descripción</option>
            <option value="checklist">Check list</option>
          </select>
        </div>

        {(!taskForm.type || taskForm.type === 'description') && (
          <div className="form-row">
            <label className="form-label">Descripción breve</label>
            <textarea
              className="form-input"
              placeholder="Opcional"
              rows={3}
              maxLength={100}
              value={taskForm.description}
              onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        )}

        {taskForm.type === 'checklist' && (
            <div className="form-row">
            <label className="form-label">Checklist</label>
            <div className="flex-row">
              <input
                className="form-input no-margin"
                placeholder="Añadir elemento (Enter para añadir)"
                value={newChecklistItem}
                maxLength={50}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={onKeyDownChecklist}
              />
              <button type="button" className="secondary-button" onClick={addChecklistItem} disabled={(taskForm.checklist || []).length >= 6}>Añadir</button>
            </div>
            <div className="space-between-row mt-6">
              <small className="muted text-small">{(taskForm.checklist || []).length}/6 elementos</small>
              <small className="muted text-small">{Math.max(0, 50 - (newChecklistItem || '').length)} caracteres restantes</small>
            </div>
            <div className="checklist-container">
              {(taskForm.checklist || []).map((it, idx) => (
                <span key={idx} className="checklist-tag">{it} <button type="button" className="column-remove-btn" onClick={() => removeChecklistItem(idx)}>x</button></span>
              ))}
            </div>
          </div>
        )}

        <div className="space-between-row">
          <div className="muted text-small">
            {taskForm.type === 'checklist' ? '' : `${Math.max(0, 100 - (taskForm.description || '').length)} caracteres restantes`}
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="main-button" onClick={onSubmit} disabled={!taskForm.title.trim()}>{taskForm.editingCardId ? 'Guardar cambios' : 'Crear tarea'}</button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

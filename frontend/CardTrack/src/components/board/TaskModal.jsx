import React from 'react';

export const TaskModal = ({ visible, columns, taskForm, setTaskForm, onSubmit, onClose }) => {
  if (!visible) return null;
  return (
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
          <button className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="main-button" onClick={onSubmit} disabled={!taskForm.title.trim()}>Crear tarea</button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

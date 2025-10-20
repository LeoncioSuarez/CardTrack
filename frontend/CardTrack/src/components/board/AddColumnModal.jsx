import React from 'react';

export const AddColumnModal = ({ visible, newColumn, setNewColumn, onClose, onSubmit }) => {
  if (!visible) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-title">Añadir columna</div>
        <div className="form-row">
          <label className="form-label">Nombre</label>
          <input
            className="form-input"
            placeholder="Ej: En progreso"
            value={newColumn.title}
            onChange={(e) => setNewColumn(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div className="form-row">
          <label className="form-label">Color del encabezado</label>
          <input
            type="color"
            value={newColumn.color}
            onChange={(e) => setNewColumn(prev => ({ ...prev, color: e.target.value }))}
            title="Color del encabezado"
            style={{ width: 50, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="main-button" onClick={onSubmit} disabled={!newColumn.title.trim()}>Crear columna</button>
        </div>
      </div>
    </div>
  );
};

export default AddColumnModal;

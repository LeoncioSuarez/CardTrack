import React, { useState } from 'react';


const CreateBoard = () => {
    const [boardName, setBoardName] = useState('');
    const [columns, setColumns] = useState([{ id: 1, name: 'Por Hacer' }, { id: 2, name: 'En Progreso' }, { id: 3, name: 'Completado' }]);
    const [newColumnName, setNewColumnName] = useState('');


    const handleAddColumn = () => {
        if (newColumnName.trim() === '') return;
        setColumns([...columns, { id: Date.now(), name: newColumnName.trim() }]);
        setNewColumnName('');
    };

    const handleRemoveColumn = (id) => {
        setColumns(columns.filter(col => col.id !== id));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (boardName.trim() === '' || columns.length === 0) {
            alert('Por favor, define el nombre del tablero y al menos una columna.');
            return;
        }
        
     
        console.log("Tablero a crear:", { name: boardName, columns });
        alert(`Tablero "${boardName}" creado con ${columns.length} columnas (simulado)`);


        setBoardName('');
        setColumns([{ id: 1, name: 'Por Hacer' }, { id: 2, name: 'En Progreso' }, { id: 3, name: 'Completado' }]);
    };

    return (
        <div className="dashboard-content-section">
            <h1 className="board-form-title">Crear Nuevo Tablero Kanban</h1>

            <form className="main-card form-container" onSubmit={handleSubmit}>
                <label className="form-label">Nombre del Tablero</label>
                <input
                    type="text"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="Ej: Proyecto Ambit2025"
                    className="form-input"
                    required
                />

                <label className="form-label">Columnas (Espacios) del Tablero</label>
                <div className="column-list">
                    {columns.map(col => (
                        <div key={col.id} className="column-tag">
                            {col.name}
                            <span className="column-remove-btn" onClick={() => handleRemoveColumn(col.id)}>
                                x
                            </span>
                        </div>
                    ))}
                </div>

                <div className="add-column-container">
                    <input
                        type="text"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="Nombre de la nueva columna (Ej: Revisión)"
                        className="form-input add-column-input"
                    />
                    <button type="button" onClick={handleAddColumn} className="secondary-button">
                        Añadir
                    </button>
                </div>

                <button type="submit" className="main-button" style={{ marginTop: '20px' }}>
                    Crear Tablero
                </button>
            </form>
        </div>
    );
};

export default CreateBoard;
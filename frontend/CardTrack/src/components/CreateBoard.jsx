import React, { useState } from 'react';
import { useAuth } from '../useAuth.js'; 
import { useNavigate } from 'react-router-dom'; 

const CreateBoard = () => {
    const { createBoard, isAuthenticated } = useAuth(); 
    const navigate = useNavigate();

    const [boardName, setBoardName] = useState('');
    const [columns, setColumns] = useState(['Por Hacer', 'En Progreso', 'Completado']); 
    const [newColumnName, setNewColumnName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddColumn = () => {
        if (newColumnName.trim() && !columns.includes(newColumnName.trim())) {
            setColumns([...columns, newColumnName.trim()]);
            setNewColumnName('');
        }
    };

    const handleRemoveColumn = (nameToRemove) => {
        setColumns(columns.filter(col => col !== nameToRemove));
    };


    const handleSubmit = async (e) => { 
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (boardName.trim() === '' || columns.length === 0) {
            setError('El nombre del tablero es obligatorio.');
            setIsLoading(false);
            return;
        }

        const result = await createBoard(boardName.trim(), columns);
        setIsLoading(false);

        if (result.success) {
            // show inline success message then navigate after short delay
            setSuccess(`Tablero "${boardName}" y ${columns.length} columnas creadas exitosamente!`);
            setTimeout(() => navigate('/boards'), 900);
        } else {
            setError(result.error || 'No se pudo crear el tablero.');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="dashboard-section">
                <h1 className="board-title">Crear Nuevo Tablero Kanban</h1>
                <p className="error-message">No estás autenticado. Inicia sesión para crear tableros.</p>
                <div style={{ marginTop: 12 }}>
                    <button className="main-button" onClick={() => navigate('/')}>Ir a iniciar sesión</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-section">
            <h1 className="board-title">Crear Nuevo Tablero Kanban</h1>
            {error && <p className="error-text error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
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
                <label className="form-label">Columnas del Tablero</label>
                <div className="column-list">
                    {columns.map((colName, index) => (
                        <div key={index} className="column-tag">
                            {colName}
                            <span className="column-remove-btn" onClick={() => handleRemoveColumn(colName)}>
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
                    <button type="button" onClick={handleAddColumn} className="main-button main-button--small" disabled={!newColumnName.trim()}>
                        Añadir
                    </button>
                </div>
                <button type="submit" className="main-button" disabled={isLoading || columns.length === 0}>
                    {isLoading ? "Creando..." : "Crear Tablero"}
                </button>
            </form>
        </div>
    );
};

export default CreateBoard;
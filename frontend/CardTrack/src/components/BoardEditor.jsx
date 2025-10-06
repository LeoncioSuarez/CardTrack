import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext.jsx';

const API_BASE_URL = 'http://localhost:8000/api';

const BoardEditor = () => {
    const { boardId } = useParams();
    const { token } = useContext(AuthContext);

    const [board, setBoard] = useState(null);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token || !boardId) return;

        const fetchData = async (url) => {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || `Error al cargar datos desde ${url}`);
            }
            return res.json();
        };

        const loadBoardData = async () => {
            setLoading(true);
            setError(null);
            try {
                const boardData = await fetchData(`${API_BASE_URL}/boards/${boardId}/`);
                setBoard(boardData);
                const columnsData = await fetchData(`${API_BASE_URL}/boards/${boardId}/columns/`);
                setColumns(columnsData);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadBoardData();
    }, [boardId, token]);

    if (loading) {
        return <div className="dashboard-content-message">Cargando tablero...</div>;
    }

    if (error) {
        return <div className="dashboard-content-message error">Error: {error}</div>;
    }

    return (
        <div className="board-editor-container">
            <h1>{board ? board.title : 'Tablero Desconocido'}</h1>
            <p className="board-verification">ID del tablero: <strong>{boardId}</strong></p>

            <div className="columns-container" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 0' }}>
                {columns.map(column => (
                    <div
                        key={column.id}
                        className="board-column main-card"
                        style={{ minWidth: '300px', padding: '15px', backgroundColor: '#ebebeb', borderRadius: '8px' }}
                    >
                        <h3>{column.title}</h3>
                        <p style={{ marginTop: '10px', color: '#777' }}>0 tareas</p>
                    </div>
                ))}
            </div>
            {columns.length === 0 && !loading && !error && <p>Este tablero no tiene columnas aún. ¡Añade una!</p>}
        </div>
    );
};

export default BoardEditor;
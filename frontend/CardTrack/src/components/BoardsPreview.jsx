import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const BoardsPreview = () => {
  const { token, user } = useContext(AuthContext);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !user) {
      setBoards([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const url = `${API_BASE_URL}/boards/`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Error en la respuesta del servidor');
        }
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        setBoards(data);
      })
      .catch(err => {
        console.error('Error cargando tableros:', err);
        setError(err.message || 'Error desconocido');
        setBoards([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const handleOpenBoard = (boardId) => {
    navigate(`/boards/${boardId}`);
  };

  const handleDeleteBoard = async (board) => {
    if (!window.confirm(`¿Eliminar el tablero "${board.title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/boards/${board.id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }
      });
      if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar el tablero');
      setBoards(prev => prev.filter(b => b.id !== board.id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="boards-preview">
      <h2 className="boards-preview-title">Tus tableros</h2>

      {loading && <p>Cargando tableros...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <div className="boards-list">
          {boards.length === 0 ? (
            <p>No tienes tableros aún.</p>
          ) : (
            boards.map((board) => (
              <div key={board.id} className="board-card main-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>{board.title}</div>
                    <div style={{ color: 'var(--color-secondary-text)', fontSize: '0.9em' }}>
                      Tareas totales: {board.task_count || (board.columns?.reduce((acc, c) => acc + (c.cards?.length || 0), 0) || 0)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="secondary-button" onClick={() => handleOpenBoard(board.id)}>Editar</button>
                    <button className="danger-button" onClick={() => handleDeleteBoard(board)}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BoardsPreview;
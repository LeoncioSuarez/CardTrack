import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { fetchBoards } from '../utils/api';

const BoardsPreview = () => {
  const { token, user } = useContext(AuthContext);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    if (!token || !user) {
      setBoards([]);
      setLoading(false);
      return () => { mounted = false; };
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoards(token);
        if (mounted) setBoards(data);
      } catch (e) {
        console.error('Error cargando tableros:', e);
        if (mounted) {
          setError(e.message || 'Error desconocido');
          setBoards([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token, user]);

  const handleOpenBoard = (boardId) => {
    navigate(`/boards/${boardId}`);
  };

  const handleDeleteBoard = async (board) => {
    if (!window.confirm(`¿Eliminar el tablero "${board.title}"?`)) return;
    try {
      await (await import('../utils/boardApi')).deleteBoard(board.id, token);
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
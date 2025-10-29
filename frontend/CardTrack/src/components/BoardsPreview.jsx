import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { fetchBoards } from '../utils/api';

const BoardsPreview = () => {
  const { token, user } = useContext(AuthContext);
  const [boards, setBoards] = useState([]);
  const [query, setQuery] = useState('');
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
    // Only allow delete if current user is owner
    const isOwner = board.user === user?.id || board.user_id === user?.id || board.owner === user?.id;
    if (isOwner) {
      if (!window.confirm(`¿Eliminar el tablero "${board.title}"?`)) return;
      try {
        await (await import('../utils/boardApi')).deleteBoard(board.id, token);
        setBoards(prev => prev.filter(b => b.id !== board.id));
      } catch (e) {
        alert(e.message);
      }
      return;
    }

    // If not owner, let user "leave" the board
    if (!window.confirm(`¿Abandonar el tablero "${board.title}"?`)) return;
    try {
      await (await import('../utils/boardApi')).leaveBoard(board.id, token);
      setBoards(prev => prev.filter(b => b.id !== board.id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="boards-preview">

      {loading && <p>Cargando tableros...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      {!loading && !error && (
        <div>
          <div className="boards-controls">
            <input
              type="search"
              placeholder="Buscar tableros..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="boards-search"
              aria-label="Buscar tableros"
            />
            <div className="muted">{boards.length} tableros</div>
          </div>

          <div className="boards-list">
            {boards.length === 0 ? (
              <p>No tienes tableros aún.</p>
            ) : (
              // filter by query and sort alphabetically by title
              boards
                .filter(b => !query || (b.title || '').toLowerCase().includes(query.toLowerCase()))
                .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
                .map((board) => (
                  <div key={board.id} className="board-card main-card">
                    <div className="board-card-row">
                      <div className="board-card__content">
                        <div className="board-title">{board.title}</div>
                      </div>
                      <div className="board-card__actions">
                        <button className="secondary-button" onClick={() => handleOpenBoard(board.id)}>Editar</button>
                        <button className="danger-button" onClick={() => handleDeleteBoard(board)}>
                          { (board.user === user?.id || board.user_id === user?.id || board.owner === user?.id) ? 'Eliminar' : 'Abandonar' }
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardsPreview;
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

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

    const url = `http://localhost:8000/api/boards/?user=${user.id}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
            const errData = await res.json();
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

  // Función que navega a la ruta dinámica
  const handleOpenBoard = (boardId) => {
    navigate(`/boards/${boardId}`);
  };

  return (
    <div className="boards-preview">
      <h2>Tus tableros</h2>

      {loading && <p>Cargando tableros...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <div className="boards-list" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {boards.length === 0 ? (
            <p>No tienes tableros aún.</p>
          ) : (
            boards.map((board) => (
              <div
                key={board.id}
                className="board-preview main-card"
                onClick={() => handleOpenBoard(board.id)} 
                style={{
                  padding: '1rem',
                  minWidth: '200px',
                  cursor: 'pointer',
                }}
              >
                <h3>{board.title}</h3>
                <p>Tareas totales: {board.task_count || 0}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BoardsPreview;
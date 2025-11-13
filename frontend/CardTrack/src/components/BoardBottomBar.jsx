import React from 'react';

// Barra inferior del editor del tablero con acciones rápidas.
// Se extrae para mantener `BoardEditor.jsx` enfocado en la orquestación.
const BoardBottomBar = ({ currentUserRole, onShowUsers, onAddColumn, onAddTask }) => {
  return (
    <div className="board-bottom-bar" role="toolbar">
      <div className="board-bottom-bar__left">
        <button className="secondary-button" onClick={onShowUsers}>Ver usuarios</button>
      </div>
      <div className="board-bottom-bar__right">
        {currentUserRole !== 'viewer' && (
          <>
            <button className="main-button main-button--small" onClick={onAddColumn}>+ Añadir columna</button>
            <button className="main-button main-button--small" onClick={onAddTask}>+ Añadir tarea</button>
          </>
        )}
      </div>
    </div>
  );
};

export default BoardBottomBar;

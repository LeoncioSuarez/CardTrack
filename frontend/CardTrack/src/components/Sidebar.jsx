import React from 'react';
import { useAuth } from '../useAuth.js';

const menuItems = [
    { id: 'profile', label: 'Mi Perfil' },
    { id: 'createBoard', label: 'Crear Tablero' },
    { id: 'myBoards', label: 'Tus Tableros' },
    { id: 'options', label: 'Opciones' },
    { id: 'security', label: 'Seguridad' },
];

const Sidebar = ({ activeView, setActiveView }) => {
    const { logout } = useAuth();

    const handleItemClick = (id) => {
        if (id === 'options' || id === 'security') {
            setActiveView('settings');
        } else {
            setActiveView(id);
        }
    };

    return (
        <div className="sidebar-menu">
            <div className="sidebar-title">CardTrack</div>
            <ul className="sidebar-list">
                {menuItems.map((item) => (
                    <li
                        key={item.id}
                        className={`menu-item${activeView === item.id ? ' active' : ''}`}
                        onClick={() => handleItemClick(item.id)}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
            <div style={{ flexGrow: 1 }}></div>
            <button className="main-button sidebar-logout-button" onClick={logout}>
                Cerrar Sesión
            </button>
        </div>
    );
};

export default Sidebar;
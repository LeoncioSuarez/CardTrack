import React from 'react';
import { useAuth } from '../useAuth.js';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
    { id: 'profile', label: 'Mi Perfil', path: '/profile' },
    { id: 'createBoard', label: 'Crear Tablero', path: '/create' },
    { id: 'myBoards', label: 'Tus Tableros', path: '/' },
    { id: 'settings', label: 'Opciones y Seguridad', path: '/settings' },
];

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleItemClick = (path) => {
        navigate(path);
    };

    return (
        <div className="sidebar-menu">
            <div className="sidebar-title">CardTrack</div>
            <ul className="sidebar-list">
                {menuItems.map((item) => {
                    const isActive =
                        location.pathname === item.path ||
                        (item.id === 'myBoards' && location.pathname.startsWith('/boards/'));

                    return (
                        <li
                            key={item.id}
                            className={`menu-item${isActive ? ' active' : ''}`}
                            onClick={() => handleItemClick(item.path)}
                        >
                            {item.label}
                        </li>
                    );
                })}
            </ul>
            <div style={{ flexGrow: 1 }}></div>
            <button className="main-button sidebar-logout-button" onClick={logout}>
                Cerrar Sesión
            </button>
        </div>
    );
};

export default Sidebar;
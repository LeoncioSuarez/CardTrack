import React from 'react';
import { useAuth } from '../useAuth.js';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
    { id: 'inicio', label: 'Inicio', path: '/' },
    { id: 'profile', label: 'Mi Perfil', path: '/profile' },
    { id: 'createBoard', label: 'Crear Tablero', path: '/create' },
    { id: 'myBoards', label: 'Tus Tableros', path: '/boards' },
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
                {menuItems.map((item) => (
                    <li
                        key={item.id}
                        // CLASE CORREGIDA: Usa 'menu-item' para coincidir con index.css
                        className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => handleItemClick(item.path)}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
            {/* CLASE CORREGIDA: Usa 'sidebar-logout-button' para la posición inferior */}
            <button onClick={logout} className="sidebar-logout-button"> 
                Cerrar sesión
            </button>
        </div>
    );
};

export default Sidebar;
import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

const menuItems = [
    { id: 'inicio', label: 'Inicio', path: '/' },
    { id: 'profile', label: 'Mi Perfil', path: '/profile' },
    { id: 'createBoard', label: 'Crear Tablero', path: '/create' },
    { id: 'myBoards', label: 'Tus Tableros', path: '/boards' },
    { id: 'settings', label: 'Opciones y Seguridad', path: '/settings' },
];

export const Sidebar = () => {
    const { logout } = useContext(AuthContext);
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
                                        const isActive = item.path === '/boards'
                                            ? location.pathname.startsWith('/boards')
                                            : location.pathname === item.path;
                    return (
                        <li
                            key={item.id}
                            className={`menu-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleItemClick(item.path)}
                        >
                            {item.label}
                        </li>
                    );
                })}
            </ul>
            {/* CLASE CORREGIDA: Usa 'sidebar-logout-button' para la posición inferior */}
            <button onClick={logout} className="sidebar-logout-button"> 
                Cerrar sesión
            </button>
        </div>
    );
};

export default Sidebar;
import React from 'react';
import { useAuth } from '../useAuth.js';
import { useNavigate, useLocation } from 'react-router-dom';
// Use the local asset placed under src/assets/logo.png (no rebuild required by Vite dev server)
import logo from '../assets/logo.png';

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
            {/* Logo: uses src/assets/logo.png; onError hides the img and reveals fallback text */}
            <div className="sidebar-title">
                <div className="logo-area">
                    <img
                        src={logo}
                        alt="CardTrack"
                        className="sidebar-logo"
                        onError={(e) => {
                            const parent = e.currentTarget && e.currentTarget.closest('.sidebar-title');
                            if (parent) parent.classList.add('no-logo');
                        }}
                    />
                </div>
                <span className="logo-text">CardTrack</span>
            </div>
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
            <button onClick={() => { logout(); navigate('/'); }} className="sidebar-logout-button"> 
                Cerrar sesión
            </button>
        </div>
    );
};

export default Sidebar;
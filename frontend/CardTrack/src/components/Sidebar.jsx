import React from 'react';
import logo from '../assets/logo.png';
import { useAuth } from '../useAuth.js';
import { useNavigate, useLocation } from 'react-router-dom';
// development swich
const DEVELOPMENT_SWITCH = false; //Change the value to true or false to allow development


const menuItems = [
    { id: 'inicio', label: 'Inicio', path: '/' },
    { id: 'profile', label: 'Mi Perfil', path: '/profile' },
    { id: 'createBoard', label: 'Crear Tablero', path: '/create' },
    { id: 'myBoards', label: 'Tus Tableros', path: '/boards' },
    { id: 'settings', label: 'Opciones y Seguridad', path: '/settings' },
];

if (DEVELOPMENT_SWITCH) {
    menuItems.splice(1, 0, { id: 'development', label: 'Development', path: '/development' });
}

export const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleItemClick = (path) => {
        navigate(path);
    };

    return (
        <div className="sidebar-menu">
            <div className="sidebar-title">
                <img src={logo} alt="CardTrack" className="sidebar-logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
            <button onClick={logout} className="sidebar-logout-button"> 
                Cerrar sesión
            </button>
        </div>
    );
};

export default Sidebar;
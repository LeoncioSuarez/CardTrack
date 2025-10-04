// src/components/Dashboard.jsx

import React, { useState } from 'react';
import { useAuth } from '../useAuth.js';
import Sidebar from './Sidebar';
import Profile from './Profile';
import CreateBoard from './CreateBoard';
import Settings from './Settings';

const Dashboard = () => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState('createBoard');

    let content;
    switch (activeView) {
        case 'profile':
            content = <Profile />;
            break;
        case 'createBoard':
            content = <CreateBoard />;
            break;
        case 'settings':
            content = <Settings />;
            break;
        case 'myBoards':
            content = <div className="boards-section"><h1>Tus Tableros</h1><p>Aquí iría la lista de tableros del usuario.</p></div>;
            break;
        default:
            content = <div className="dashboard-section"><h1>Bienvenido, {user ? user.name || user.email : 'Usuario'}</h1><p>¡Has iniciado sesión exitosamente! Ahora puedes trabajar en la vista de tableros y tareas.</p></div>;
    }

    return (
        <div className="dashboard-container">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="dashboard-content">
                {content}
            </div>
        </div>
    );
};

export default Dashboard;